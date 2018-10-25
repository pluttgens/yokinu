import config from 'config';
import fs from 'fs-extra';
import {operationalLogger} from '../loggers/index.mjs';
import {EXIT_CODES} from '../errors/index.mjs';

export default async () => {
  try {
    await fs.remove(config.storage.temp_data);
    await fs.ensureDir(config.storage.temp_data);
    await fs.remove(config.livestream.hls.directory);
    await fs.ensureDir(config.livestream.hls.directory);
  } catch (e) {
    operationalLogger.error(e);
    process.exit(EXIT_CODES.FAILED_TO_INIT);
  }
}
