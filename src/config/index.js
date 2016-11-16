'use strict';

var config;

try {
  config = require('./config.private.json');
} catch (e) {
  try {
    config = require('./config.json');
  } catch (e) {
    throw new Error('No config file found.');
  }
}

module.exports = config;
