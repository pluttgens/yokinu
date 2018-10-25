import BaseService from '../BaseService';
import db from '../../database/index.mjs';
import fs from 'fs-extra';
import deleteEmpty from 'delete-empty';
import { operationalLogger } from '../../loggers/index.mjs';
import path from 'path';
import glob from 'glob-promise';
import InvalidTrackInputError from '../errors/InvalidTrackInputError';

export default class LocalService extends BaseService {
  constructor(serviceConfig) {
    super('local', serviceConfig);

    this.androidId = null;
    this.masterToken = null;
  }

  async _init() {
    await fs.mkdirs(this.config.dataDir);
    operationalLogger.info(`Service ${this.name} initialized.`)
  }

  registerRoutes(router) {
    return super.registerRoutes(router);
  }

  async load(params) {
    super.load(params);
    const files = await glob(`${this.config.data_dir}/**/*`, {
      nodir: true
    });
    const tracks = await db.track.findAll({ attributes: ['path'] });
    const trackPaths = tracks.map(track => track.path);
    await Promise.all(
      files
        .filter(file => !(file in trackPaths))
        .map(async file => {
          operationalLogger.info(`Processing new local file : ${file}`);
          try {
            const { size } = await fs.stat(file);
            return this.putFile({ filepath: file, size });
          } catch (err) {
            operationalLogger.error(err);
          }
        }));
    await deleteEmpty(this.config.data_dir);
    return db.track.indexInElasticsearch();
  }

  async getStream(track) {
    const stream = await fs.createReadStream(track.path);
    const { size } = await fs.stat(track.path);
    stream.size = size;
    return stream;
  }

  async _putTrack(input, track, transaction) {
    const stream = this._createReadStream(input);
    const newDir = path.join(this.config.dataDir, await track.getFsPath({
      includeTitle: false,
      includeFormat: false,
      join: true,
      transaction
    }));
    await fs.ensureDir(newDir);

    let discriminant = 0;
    let free = false;
    do {
      track.path = path.join(this.config.dataDir, await track.getFsPath({
        includeTitle: true,
        includeFormat: true,
        discriminant,
        join: true,
        transaction
      }));

      try {
        await fs.access(track.path);
        free = false;
        operationalLogger.debug(`${track.path} already exists.`);
        ++discriminant;
      } catch (err) {
        free = true
      }
    } while (!free && discriminant < 99);

    if (!free) throw InvalidTrackInputError('Cannot upload the same song 100 times.');

    operationalLogger.debug(`Piping to ${track.path}`);
    stream.pipe(fs.createWriteStream(track.path));
    return track;
  }

  async cleanup() {
    await fs.remove(this.config.dataDir);
  }

  isLocal() {
    return true;
  }
}

