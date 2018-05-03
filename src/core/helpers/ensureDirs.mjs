import config from 'config';
import fs from 'fs-extra';
import {operationalLogger} from '../loggers/index.mjs';
import {EXIT_CODES} from '../errors/index.mjs';

export default async () => {
  try {
    await fs.ensureDir(config.yokinu.temp_data);
    await fs.remove(config.yokinu.streaming_dir);
    await fs.ensureDir(config.yokinu.streaming_dir);
  } catch (e) {
    operationalLogger.error(e);
    process.exit(EXIT_CODES.FAILED_TO_INIT);
  }
}
