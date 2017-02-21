'use strict';

const Snowflake = require('node-snowflake');
const Promise = require('bluebird');
const worker = new Snowflake.Worker({retry: true});
const fs = Promise.promisifyAll(require('fs'));
const config = require('../config.json');
const mkdirp = require('mkdirp');

try {
  mkdirp.sync(config.coverPath);
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

module.exports.save = async (format, data) => {
  const filename = (await worker.getId()) + '.' + format;
  await fs.writeFileAsync(config.coverPath + filename, data);
  return filename;
};

module.exports.get = async filename => {
  return await fs.readFileAsync(config.coverPath + filename);
};
