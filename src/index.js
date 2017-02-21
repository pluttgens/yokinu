'use strict';

const http = require('http');
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const Promise = require('bluebird');
const path = require('path');
const routes = require('./core/routes/index');

(async () => {
  const app = express();

  app.disable('etag');
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(cors());

  const services = [
    'gmusic',
    // 'dropbox'
  ];

  app.locals.services = {};
  const promises = [];

  console.log('Loading services...');
  for (let serviceName of services) {
    app.locals.services[serviceName] = require('./modules/' + serviceName);
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
    res.send(err.stack);
  });

  const port = process.env.PORT || 4100;
  const server = http.createServer(app);
  server.listen(port);
  console.log('listening on port ' + port);
})().catch(err => {
  console.log(err);
  throw err;
});
