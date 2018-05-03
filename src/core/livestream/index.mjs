import config from 'config';
import fs from 'fs-extra';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import _ from 'lodash';
import glob from 'glob-promise';
import db from '../database/index.mjs';
import { operationalLogger } from '../loggers/index.mjs';
import Sequelize from 'sequelize';

const Op = Sequelize.Op;

const {hlsTime, hlsSize, directory} = config.yokinu.livestream;

class LiveStream {
  constructor() {
    this.command = null;
    this.current = null;
    this.timeMark = null;
    this.tracksIt = null;
  }

  async startStream() {
    if (this.command) {
      return;
    }
    try {
      const tracks = await this.createIterator();
      this.play();
      return tracks;
    } catch (err) {
      operationalLogger.error(err);
    }
  }

  async createIterator() {
    let tracks = await db.track.findAll({
      include: [
        { model: db.artist, as: 'artist' },
        { model: db.album, as: 'album' },
        { model: db.genre, as: 'genres' }
      ]
    });
    tracks = _.shuffle(tracks);
    this.tracksIt = tracks[Symbol.iterator]();
    return tracks;
  }

  play() {
    const trackIt = this.tracksIt.next();
    if (trackIt.done) return;
    const track = trackIt.value;
    operationalLogger.debug(`Playing : ${track}`);
    operationalLogger.debug(`path : ${track.path}`);

    this.current = track;
    this.command = ffmpeg(track.path)
      .noVideo()
      .native()
      .outputFormat('hls')
      .audioCodec('aac')
      .outputOption(`-minrate ${track.bitrate / 1000}k`)
      .outputOption(`-maxrate ${track.bitrate / 1000}k`)
      .outputOption(`-hls_time ${hlsTime}`)
      .outputOption(`-hls_list_size ${hlsSize}`)
      .outputOption(`-hls_segment_filename ${path.join(directory, track.id)}%04d.ts`)
      .outputOption('-hls_flags omit_endlist+append_list+discont_start')
      .on('start', operationalLogger.info.bind(operationalLogger))
      .on('end', () => {
        operationalLogger.debug('ffmpeg end');
        this.setCleanup(track.id);
        return this.play();
      })
      .on('progress', progress => {
        this.timeMark = progress.timemark;
      })
      .on('error', err => {
        operationalLogger.debug('ffmpeg error');
        operationalLogger.error(err);
        this.setCleanup(track.id);
        return this.play();
      })
      .save(path.join(config.yokinu.streaming_dir, 'index.m3u8'));
  }

  async getFile(filename) {
    await fs.ensureFile(path.join(directory, filename));
    return fs.createReadStream(path.join(directory, filename));
  }

  async setCleanup(id) {
    setTimeout(async () => {
      const files = await glob(`${directory}/${id}*`, {
        nodir: true
      });

      files.forEach(async file => {
        try {
          await fs.remove(file);
        } catch (err) {
          operationalLogger.error(err);
        }
      });
    }, hlsSize * hlsTime * 2);
  }

  get isStarted() {
    return !!this.command;
  }

  skip() {
    if (this.command) {
      this.command.kill();
    }
  }
}

export default new LiveStream();
