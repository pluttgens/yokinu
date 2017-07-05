import Snowflake from 'node-snowflake';
import config from 'config';

export default new Snowflake.Worker({
  datacenterId: config.env.datacenterId,
  workerId: config.env.workerId,
  retry: true
});
