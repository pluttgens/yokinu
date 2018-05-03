import BaseService from '../BaseService';
import db from '../../database/index.mjs';
import fs from 'fs-extra';
import deleteEmpty from 'delete-empty';
import { operationalLogger } from '../../loggers/index.mjs';
import { EXIT_CODES } from '../../errors/index.mjs'
import path from 'path';
import glob from 'glob-promise';
import sanitize from 'sanitize-filename';

export default class LocalService extends BaseService {
  constructor(config) {
    super('local', config);

    this.androidId = null;
    this.masterToken = null;
  }

  async init() {
    super.init();
    try {
      await fs.mkdirs(this.config.data_dir);
      operationalLogger.info(`Service ${this.name} initialized.`)
    } catch (e) {
      operationalLogger.error(e);
      process.exit(EXIT_CODES.SERVICE_ERROR)
    }
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
            return this.putTrack({ filepath: file, size });
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

  async putTrack({ filepath, mime, size }) {
    const transaction = await db.sequelize.transaction();
    try {
      const track = await db.track.fromFile(this.name, filepath, mime, size);
      const artist = await track.getArtist({ transaction });
      const album = await track.getAlbum({ transaction });
      const newDir = path.join(this.config.data_dir, sanitize(artist.name), sanitize(album.name));
      await fs.ensureDir(newDir);
      const newPath = path.join(newDir, sanitize(track.title) + path.extname(track.path));
      operationalLogger.debug(`Moving ${track.path} to ${newDir}`);
      await fs.move(track.path, newPath, { overwrite: true });
      track.path = newPath;
      await track.save({ transaction });
      await transaction.commit();
      return track;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  getBatchSize() {
    return super.getBatchSize();
  }
}
