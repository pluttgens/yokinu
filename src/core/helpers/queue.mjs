import config from 'config';
import kue from 'kue';

export default kue.createQueue({
  redis: `redis://${config.yokinu.redis.host}:${config.yokinu.redis.port}`
});
