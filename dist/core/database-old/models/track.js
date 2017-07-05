'use strict';

var Promise = require('bluebird');
var Datastore = require('nedb');
var config = require('../config.json');

module.exports = Promise.promisifyAll(new Datastore({
  filename: config.dbPath + 'tracks.db',
  autoload: true
}));
// # sourceMappingURL=track.js.map
