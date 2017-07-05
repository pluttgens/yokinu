'use strict';

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var options = {
  server: {
    auto_reconnect: true,
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

module.exports = {
  Track: require('./models/track').model,
  User: require('./models/user').model
};
// # sourceMappingURL=index.js.map
