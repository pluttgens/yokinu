import config from 'config';
import winston from 'winston';

export default new (winston.Logger)({
  level: 'info',
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      prettyPrint: true,
      timestamp: true,
      label: 'Elasticsearch'
    }),
    new (winston.transports.File)({
      colorize: true,
      prettyPrint: true,
      timestamp: true,
      filename: `${config.yokinu.logging.directory}/elasticsearch.log`
    })
  ]
});
