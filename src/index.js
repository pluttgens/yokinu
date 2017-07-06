import config from 'config';
import http from 'http';
import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import compress from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import Promise from 'bluebird';
import path from 'path';
import routes from './core/routes/index';
import database from './core/database';
import { accessLogger } from './core/loggers';
import * as controllers from './core/controllers';
import { snowflake } from './core/helpers';

(async () => {
  await database.init();

  const app = express();

  app.disable('etag');
  app.use(logger("combined", { "stream": { write: message => accessLogger.info(message) } }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cors());
  app.use(helmet());
  app.use(compress());

  const services = [
    'gmusic',
    // 'dropbox'
  ];

  app.locals.services = {};
  const promises = [];

  console.log('Loading services...');
  for (let serviceName of services) {
    app.locals.services[serviceName] = new (require('./services/' + serviceName).default)(Object.assign({}, config[services], { low_memory: config.yokinu.low_memory }), {
      database,
      controllers: { track: controllers.trackController },
      snowflake
    });
    await app.locals.services[serviceName].init()
  }

  await Promise.all(promises);
  console.log('Services loaded!');

  const apiPrefix = '/api';

  app.locals.static = {
    covers: '/static/covers',
  };

  app.use(app.locals.static.covers, express.static(path.join(__dirname, '..', 'data', 'covers')));

  app.use(apiPrefix + '/playlists', routes.playlists);
  app.use(apiPrefix + '/services', routes.services);
  app.use(apiPrefix + '/tracks', routes.tracks);

  app.use((err, req, res, next) => {
    console.log(err);
    res.send(err.stack || err);
  });

  const port = config.yokinu.port;
  const server = http.createServer(app);
  server.listen(port);
  console.log('listening on port ' + port);
})().catch(err => {
  console.log(err);
  throw err;
});
