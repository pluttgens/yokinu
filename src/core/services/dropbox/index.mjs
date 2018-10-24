import config from 'config';
import path from 'path';
import https from 'https';
import Dropbox from 'dropbox';
import fs from 'fs';
import _ from 'lodash';
import request from 'request';
import BaseService from '../BaseService';
import db from '../../database/index.mjs';
import Promise from 'bluebird';
import Queue from 'bee-queue';
import Sequelize from 'sequelize';
import mm from 'music-metadata';
import { operationalLogger } from '../../loggers/index.mjs';


const Op = Sequelize.Op;

export default class DropboxService extends BaseService {
  constructor(serviceConfig) {
    super('dropbox', serviceConfig);

    this.client = new Dropbox({
      accessToken: this.config.token
    });

    this.loadQueue = new Queue(`${this.name} - load`, {
      redis: {
        host: config.yokinu.redis.host,
        port: config.yokinu.redis.port
      },
      removeOnSuccess: true
    });

    this.loadQueue.process(async entry => {
      const download = this.client.filesGetTemporaryLink({
        path: entry.id
      });

      const transaction = await db.sequelize.transaction();
      try {
        const track = db.track.fromStream(this.name, entry.id, entry.name, request.get(download.link), entry.size, transaction);
        await track.indexInElastic();
        await track.save({ transaction });
        return transaction.commit();
      } catch (err) {
        await transaction.rollback();
        return Promise.reject(err);
      }
    });
  }

  async load() {
    Promise
      .map(
        this.config.directories,
        async directory => {
          let entries = [];
          let result = this.client.filesListFolder({
            path: directory,
            recursive: true,
            include_media_info: true
          });

          entries = entries.concat(result.entries);

          while (result.has_more) {
            result = await this.client.filesListFolderContinue({
              cursor: result.cursor
            });

            entries = entries.concat(result.entries);
          }

          return entries.filter(entry => entry['.tag'] === 'file');
        }
      )
      .mapSeries(async entries => {
        let chunkedEntries = _.chunk(entries, 100);
        return Promise
          .mapSeries(
            chunkedEntries,
            async entries => {
              const tracks = await db.findAll({
                where: {
                  service: this.name,
                  path: {
                    [Op.in]: entries.map(entry => entry.id)
                  }
                },
                attributes: ['path']
              });

              return _.difference(entries, tracks, (entry, track) => entry.id === track.path);
            });
      })
      .reduce((flatten, curr) => flatten.concat(curr), [])
      .each(entry => this.loadQueue.createJob(entry).save());
  }

  async _putTrack(input, track, transaction) {
    const dropboxFilePath = await track.getFsPath({
      includeTitle: true,
      join: true,
      transaction
    });

    const contents = await fs.promises.readFile(input);
    operationalLogger.debug(`Uploading ${input} to ${dropboxFilePath} on ${this.name}.`);
    operationalLogger.debug(`File size : ${contents.length}`);
    const fileUploadSessionStartResult = await this.client.filesUploadSessionStart({
      contents
    });

    const fileMetadata = await this.client.filesUploadSessionFinish({
      cursor: {
        session_id: fileUploadSessionStartResult.session_id,
        offset: contents.length
      },
      commit: {
        path: `${this.config.directory}/${dropboxFilePath}`,
        autorename: true,
        mute: true
      }
    });

    track.path = fileMetadata.id;
    return track;
  }

  async getStream(track) {
    let download = await this.client.filesGetTemporaryLink({
      path: track.path
    });
    operationalLogger.debug(`Dropbox temporary download link for ${track} : ${download.link}`);
    return _getStream(download.link);
  }

  async _cleanup() {
    operationalLogger.debug(`Removing data at path ${this.config.directory}`);
    try {
      await this.client.filesDeleteV2({path: this.config.directory});
    } catch (e) {
      const error = e.error.error;
      if (error['.tag'] === 'path_lookup' && error.path_lookup['.tag'] === 'not_found')
        return;
      throw e;
    }
  }
}


async function addToDb(entries) {
  const promises = [];
  for (let entry of entries) {
    if (entry['.tag'] !== 'file') continue;
    console.log(entry);
    const alreadyExists = await db.Track.findOneAsync({
      service: 'dropbox',
      path: entry.id
    });
    if (alreadyExists) {
      console.log('Already exists!');
      continue;
    }
    let download = await dropbox.filesGetTemporaryLink({
      path: entry.id
    });
    const stream = await _getStream(download.link);
    let metadata;
    try {
      metadata = await new Promise((resolve, reject) => {
        mm(stream, { duration: true, fileSize: download.metadata.size }, (err, metadata) => {
          if (err) return reject(err);
          resolve(metadata);
        });
      });
    } catch (err) {
      continue;
    }
    stream.destroy();
    let trackFromSameAlbum;
    if (metadata.artist.join(', ') && metadata.album && metadata.artist.join(',') !== 'Unknown' && metadata.album !== 'Unknown') {
      trackFromSameAlbum = await db.Track.findOneAsync({
        artist: metadata.artist.join(', '),
        album: metadata.album
      });
    }
    let picturePaths;
    if (trackFromSameAlbum && trackFromSameAlbum.covers) {
      picturePaths = trackFromSameAlbum.covers;
    } else {
      picturePaths = await Promise.all(metadata.picture.map(pic => db.Cover.save(pic.format, pic.data)));
    }
    promises.push(db.Track.insertAsync({
      title: metadata.title || 'Unknown',
      artist: metadata.artist.join(', ') || 'Unknown',
      album: metadata.album,
      duration: metadata.duration,
      track: metadata.track,
      disk: metadata.disk,
      genre: metadata.genre,
      covers: picturePaths,
      service: 'dropbox',
      path: entry.id
    }));
  }
  await Promise.all(promises);
}


function _getStream(link) {
  return new Promise((resolve, reject) => {
    https
      .get(link, resolve)
      .on('error', reject);
  });
}
