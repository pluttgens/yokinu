'use strict';

const config = require('../../config').yokinu;
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const options = {
  server: {
    auto_reconnect: true,
    poolSize: config.low_memory ? 1 : 5,
    socketOptions: {
      keepAlive: 1,
      connectTimeoutMS: 300000
    }
  }
};

mongoose.connect('mongodb://mongodb/ykn', options);

process.on('SIGINT', function () {
  mongoose.connection.close(function () {
    console.log('Mongoose disconnected on app termination');
    process.exit(0);
  });
});

module.exports  = {
  Playlist: require('./models/playlist').model,
  Track: require('./models/track').model,
  User: require('./models/user').model
};
