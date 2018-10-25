import config from 'config';
import fs from 'fs-extra';
import Stream from 'stream';
import Promise from 'bluebird';
import Sequelize from 'sequelize';
import db from '../database/index.mjs'
import _ from 'lodash';
import {File} from '../helpers';
import { operationalLogger } from '../loggers/index.mjs';
import { SERVICE_ERROR } from '../errors/exit-codes.mjs';

import serviceManager from './ServiceManager';
import * as env from '../helpers/env';
import * as EXIT_CODES from '../errors/exit-codes';
import PlaylistNotFoundError from './errors/PlaylistNotFoundError';

const Op = Sequelize.Op;

export default class BaseService {
  constructor(name) {
    this.name = name;
    this.config = config.services[this.name];
  }

  async init() {
    operationalLogger.info(`Initializing service : ${this.name}.`);
    await db.service.findOrCreate({
      where: {
        id: this.name
      }
    });

    try {
      if (env.shouldForceSync()) {
        await this.cleanup();
      }
      await this._init();
    } catch (err) {
      operationalLogger.error(err);
      process.exit(EXIT_CODES.SERVICE_ERROR)
    }
  }

  async _init() {

  }

  registerRoutes(router) {

  }

  async load(params) {
    operationalLogger.info(`Loading service : ${this.name}`);
  }

  getStream(path) {

  }

  async putTrack(input, { mime, size, tags = {}, trackId, requestId, deleteOld = false, playlistId } = {}) {
    const transaction = await db.sequelize.transaction();
    try {
      let file;
      if (input instanceof Stream) {
        operationalLogger.debug(`Input is a stream.`);
        file = await File.fromStream(input);
      } else {
        file = await File.fromFile({filePath: input, mime, size});
      }

      let track;

      if (trackId) {
        track = await db.track.findById(trackId, { transaction });
      } else {
        track = await db.track.fromFile(file, {
          userTags: tags,
          transaction,
          requestId
        });
      }

      operationalLogger.info(`Putting track to ${this.name} service`);
      track = await this._putTrack(file.path, track, transaction);
      if (deleteOld && track.serviceId) {
        serviceManager.get(track.serviceId).deleteTrack(track);
      }
      track.serviceId = this.name;

      if (playlistId) {
        const playlist = await db.playlist.findById(playlistId, {transaction});
        await track.addPlaylist(playlist);
      }

      track = await track.save({
        transaction
      });

      operationalLogger.info(`Successfully added ${track}.`);
      await track.indexInElastic({ transaction });
      await transaction.commit();
      return track;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  _createReadStream(filePath) {
    return fs
      .createReadStream(filePath)
      .on('error', err => {
        operationalLogger.error(err);
      });
  }

  async _putTrack(input, track, transaction) {
    operationalLogger.fatal(`${this.name} needs to implement ${_.capitalize(this.name)}#_putTrack.`);
    try {
      await transaction.rollback();
    } catch (e) {
      operationalLogger.error(e);
    } finally {
      process.exit(SERVICE_ERROR);
    }
  }

  async deleteTrack(track) {

  }

  async getUnloadedTracks({ withServiceTags, skip, limit }) {
    return [];
  }

  async cleanup() {
    operationalLogger.info(`Service ${this.name} - removing data.`);
    await this._cleanup();
    operationalLogger.info(`Service ${this.name} - removed data.`);
  }

  async _cleanup() {

  }

  isLocal() {
    return false;
  }
}
