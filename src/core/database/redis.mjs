import config from 'config';
import Redis from 'redis';
import Promise from 'bluebird';
import { redisLogger } from '../loggers/index.mjs';
import { EXIT_CODES } from '../errors/index.mjs';

export const redis = Promise.promisifyAll(Redis.createClient({
  host: config.yokinu.redis.host,
  port: config.yokinu.redis.port
}));

redis.on('error', (err) => {
  redisLogger.error(err);
});

export async function init({ shouldForceSync }) {
  try {
    if (shouldForceSync) {
      await redis.send_commandAsync('FLUSHALL');
      redisLogger.info('Flushed all databases.');
    }
  } catch (err) {
    redisLogger.error(e);
    process.exit(EXIT_CODES.REDIS_ERROR);
  }
}
