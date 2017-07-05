import Snowflake from 'node-snowflake';
import config from 'config';

export default new Snowflake.Worker({
  datacenterId: config.datacenterId,
  workerId: config.workerId,
  retry: true
});
