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

  const modules = [
    // 'gmusic',
    'dropbox'
  ];

  let jonCheck = false;
  if (modules.find(module => module == 'jon-check')) jonCheck = true;

  app.locals.streamProviders = {};
  const promises = [];

  console.log('Loading modules...');
  for (let moduleName of modules) {
    let module = require('./modules/' + moduleName);
    // promises.push(module.load());
    app.locals.streamProviders[moduleName] = module.getStream;
  }

  await Promise.all(promises);
  console.log('Modules loaded!');

  const apiPrefix = '/api';

  app.locals.static = {
    covers: '/static/covers',
  };

  app.use(app.locals.static.covers, express.static(path.join(__dirname, '..', 'data', 'covers')));


  app.use(apiPrefix + '/library', routes.library);

  if (jonCheck) {
    app.use(app.use(), express.static(path.join(__dirname, '..', 'jon-check')))
    app.use('*', (req, res) => res.send());
  }

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
