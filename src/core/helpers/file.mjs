import path from 'path';
import fs from 'fs-extra';
import tmp from 'tmp-promise';
import config from 'config';
import Promise from 'bluebird';
import { operationalLogger } from '../loggers/index';
import magic from 'stream-mmmagic';
import mimeTypes from 'mime-types';

const magicAsync = Promise.promisify(magic, { multiArgs: true });

export default class File {
  constructor({ filePath, mime, size }) {
    this.path = filePath;
    this.mime = mime;
    this.size = size;
    operationalLogger.info(`New file : ${this.path} | ${this.mime} | ${this.size}`);
  }

  getStream() {
    return fs.createReadStream(this.path);
  }

  static async fromFile({filePath, mime, size}) {
    const extension = File.mapExt(mimeTypes.extension(mime) || path.extname(filePath).slice(1));
    const nFileName = path.basename(filePath, path.extname(filePath)) + `.${extension}`;
    const nFilePath = path.join(path.dirname(filePath), nFileName);
    await fs.move(filePath, nFilePath);
    operationalLogger.debug(`Moved file to ${nFilePath}`);
    return new File({
      filePath: nFilePath,
      mime,
      size
    })
  }

  static async fromStream(stream) {
    const file = await tmp.file({
      dir: config.yokinu.temp_dir,
      prefix: `download-`,
      keep: true
    });

    await new Promise((resolve, reject) => {
      stream
        .pipe(fs.createWriteStream(file.path))
        .on('finish', () => {
          operationalLogger.debug(`Wrote stream to ${file.path}`);
          resolve();
        })
        .on('error', reject);
    });

    const filePath = file.path;
    const mime = (await magicAsync(fs.createReadStream(file.path)))[0].type;
    const size = (await fs.stat(file.path)).size;
    return File.fromFile({filePath, mime, size});
  }

  getExt() {
    return path.extname(this.path).slice(1);
  }

  static get EXTENSIONS() {
    return {
      mpga: 'mp3'
    }
  };

  static mapExt(ext) {
    if (!ext in File.EXTENSIONS) return ext;
    return File.EXTENSIONS[ext];
  }
}
