'use strict';

const Promise = require('bluebird');
const Datastore = require('nedb');
const config = require('../config.json');

module.exports = Promise.promisifyAll(new Datastore({
  filename: config.dbPath + 'tracks.db',
  autoload: true
}));
