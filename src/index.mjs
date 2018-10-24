import config from 'config';
import http from 'http';
import path from 'path';
import express from 'express';
import morgan from 'morgan';
import addRequestId from 'express-request-id';
import bearerToken from 'express-bearer-token';
import bodyParser from 'body-parser';
import compress from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import {jwtAuth} from './core/auth/index.mjs';
import database from './core/database/index';
import { accessLogger, operationalLogger } from './core/loggers/index.mjs';
import livestream from './core/livestream/index.mjs';
import {
  authenticationRoutes,
  jobRoutes,
  livestreamRoutes,
  playlistsRoutes,
  servicesRoutes,
  tracksRoutes,
  usersRoutes
} from './core/routes/index';
import { serviceManager } from './core/services/index.mjs';
import { ensureDirs, params } from './core/helpers/index';
import HttpError from 'http-errors';

morgan.token('id', req => req.id);
morgan.token('body', req => req.method === 'POST' ? JSON.stringify(params.removePassword(req.body)) : '');

(async () => {
  await database.init();
  await ensureDirs();
  await serviceManager.init();

  if (config.yokinu.livestream.autoStart)
    await livestream.startStream();

  const app = express();

  app.disable('etag');
  app.use(morgan(
    ":id :remote-addr - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :body :res[content-length] \":referrer\" \":user-agent\"",
    { "stream": { write: message => accessLogger.info(message) } })
  );
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cors());
  app.use(helmet());
  app.use(compress());
  app.use(addRequestId());
  app.use(bearerToken());

  const apiPrefix = '/api';

  app.locals.static = {
    covers: '/static/covers',
  };

  app.use(app.locals.static.covers, express.static(path.join(config.yokinu.temp_data, 'covers')));

  app.use(apiPrefix + '/authentications', authenticationRoutes);
  app.use(apiPrefix + '/jobs', jwtAuth(), jobRoutes);
  app.use(apiPrefix + '/livestream', jwtAuth(), livestreamRoutes);
  app.use(apiPrefix + '/playlists', jwtAuth(), playlistsRoutes);
  app.use(apiPrefix + '/services', jwtAuth(), servicesRoutes);
  app.use(apiPrefix + '/tracks', jwtAuth(), tracksRoutes);
  app.use(apiPrefix + '/users', usersRoutes);

  app.use((err, req, res, next) => {
    if (!err.expose) {
      operationalLogger.error(err);
      if (!(err instanceof HttpError.HttpError)) {
        err = new HttpError.InternalServerError();
      }
    }
    res.status(err.status).json(err);
  });

  const port = config.yokinu.port;
  const server = http.createServer(app);
  server.listen(port);
  console.log('listening on port ' + port);
})().catch(err => {
  console.log(err);
  throw err;
});
