import Snowflake from 'node-snowflake';
import config from 'config';

const snowflake = new Snowflake.Worker({
  datacenterId: config.datacenterId,
  workerId: config.workerId,
  retry: true
});

export function getSnowflake() {
  return snowflake;
}

export function getId() {
  return snowflake.getId();
}
