'use strict';

const mongoose = require('mongoose');
const elasticsearch = require('../elasticsearch');

const trackSchema = mongoose.Schema({
  title: String,
  artist: String,
  album: String,
  duration: Number,
  track: {
    n: Number,
    of: Number
  },
  disk: {
    n: Number,
    of: Number
  },
  genres: [String],
  covers: [{
    type: { type: String, enum: ['web', 'local'] },
    path: String
  }],
  size: Number,
  service: { type: String, required: true },
  path: { type: String, required: true, unique: true },
  playlists: [{
    name: String,
    service: { type: String, required: true }
  }]
});

trackSchema.index({ service: 1, path: 1 }, { unique: true });
trackSchema.index({ title: 'text', artist: 'text', album: 'text' }, {
  weights: {
    title: 5,
    artist: 3,
    album: 2
  }
});

trackSchema.statics.indexServiceInES = function (service) {
  return this
    .find({
      service: service
    })
    .exec()
    .then(tracks => {

      elasticsearch.bulk({
        body: tracks.reduce((prev, track) => {
          prev.push({ index: { _index: 'ykn', _type: 'tracks', _id: track.id } });
          prev.push({
            title: track.title,
            artist: track.artist,
            album: track.album
          });
          return prev;
        }, [])
      });
    });
};

module.exports = {
  model: mongoose.model('Track', trackSchema),
  schema: trackSchema
};
