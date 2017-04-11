'use strict';

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'elasticsearch:9200',
  log: 'trace'
});

module.exports = client;
