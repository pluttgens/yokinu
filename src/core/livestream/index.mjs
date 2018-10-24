import config from 'config';
import fs from 'fs-extra';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import Promise from 'bluebird';
import glob from 'glob-promise';
import db from '../database/index.mjs';
import { Queue } from '../helpers/index.mjs';
import { operationalLogger } from '../loggers/index.mjs';
import Sequelize from 'sequelize';

const Op = Sequelize.Op;

const HLS = config.yokinu.livestream.hls;

function log(message) {
  return `[Livestream] ${message}`;
}

class LiveStream {
  constructor() {
    this.command = null;
    this.current = null;
    this.timeMark = null;
    this.queue = new Queue();
    this.isPlaying = false;
  }

  async startStream(options = {}) {
    if (this.command) {
      return;
    }
    operationalLogger.info(log(`Starting live stream : ${options}.`));
    try {
      if (options.all) {
        await this.queueAll();
      }
      if (options.shuffle) {
        this.queue.shuffle();
      }
      const queued = this.queue.data.slice(0);
      this.play();
      return queued;
    } catch (err) {
      operationalLogger.error(err);
    }
  }

  get shouldPlay() {
    return this.isPlaying && !this.queue.length;
  }

  async queueTrack({ id, options = {} }) {
    const track = await db.track.findById(id, {
      include: [
        { model: db.artist, as: 'artist' },
        { model: db.album, as: 'album' },
        { model: db.genre, as: 'genres' }
      ]
    });

    const shouldPlay = this.shouldPlay;
    this.queue.push(track, options);
    if (shouldPlay) {
      await this.startStream();
    }
    return track;
  }

  async queueAll(options = {}) {
    operationalLogger.info(`Queueing all tracks : ${options}.`);
    const tracks = await db.track.findAll({}, {
      include: [
        { model: db.artist, as: 'artist' },
        { model: db.album, as: 'album' },
        { model: db.genre, as: 'genres' }
      ]
    });

    const shouldPlay = this.shouldPlay;
    this.queue.push(tracks, options);
    if (shouldPlay) {
      await this.startStream();
    }
    return tracks;
  }

  async queueTracks({ ids, options = {} }) {
    const tracks = await db.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      include: [
        { model: db.artist, as: 'artist' },
        { model: db.album, as: 'album' },
        { model: db.genre, as: 'genres' }
      ]
    });

    const shouldPlay = this.shouldPlay;
    this.queue.push(tracks, options);
    if (shouldPlay) {
      await this.startStream();
    }
    return tracks;
  }

  async queuePlaylist(id) {
    const playlist = await db.playlist.findById(id);
  }

  play() {
    const track = this.queue.next();
    if (!track) {
      this.isPlaying = false;
      return;
    }
    operationalLogger.debug(log(`Playing : ${track}`));
    operationalLogger.debug(log(`path : ${track.path}`));

    this.current = track;
    this.command = ffmpeg(track.path)
      .noVideo()
      .native()
      .outputFormat('hls')
      .audioCodec('aac')
      .outputOption(`-minrate ${track.bitrate / 1000}k`)
      .outputOption(`-maxrate ${track.bitrate / 1000}k`)
      .outputOption(`-hls_time ${HLS.time}`)
      .outputOption(`-hls_list_size ${HLS.listSize}`)
      .outputOption(`-hls_segment_filename ${path.join(HLS.directory, track.id)}%04d.ts`)
      .outputOption('-hls_flags omit_endlist+append_list+discont_start')
      .on('start', operationalLogger.info.bind(operationalLogger))
      .on('end', () => {
        operationalLogger.debug('ffmpeg end');
        this.setCleanup(track);
        return this.play();
      })
      .on('progress', progress => {
        this.timeMark = progress.timemark;
      })
      .on('error', err => {
        operationalLogger.debug('ffmpeg error');
        operationalLogger.error(err);
        this.setCleanup(track);
        return this.play();
      })
      .save(path.join(HLS.directory, 'index.m3u8'));
  }

  async getFile(filename) {
    return fs.createReadStream(path.join(HLS.directory, filename));
  }

  async setCleanup(track) {
    const delay = HLS.time * HLS.listSize * 2 * 1000;
    operationalLogger.debug(log(`Scheduled cleanup for ${track} in ${delay} ms.`));
    await Promise.delay(delay);
    operationalLogger.info(log(`Cleaning up .ts for ${track.id}.`));
    const files = await glob(`${HLS.directory}/${track.id}*`, {
      nodir: true
    });

    files.forEach(async file => {
      try {
        await fs.remove(file);
      } catch (err) {
        operationalLogger.error(err);
      }
    });
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
