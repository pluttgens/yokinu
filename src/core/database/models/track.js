'use strict';

const mongoose = require('mongoose');

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
    type: {type: String, enum: ['web', 'local']},
    path: String
  }],
  size: Number,
  service: {type: String, required: true},
  path: {type: String, required: true, unique: true},
  playlists: [{
    name: String,
    service: {type: String, required: true}
  }]
});

trackSchema.index({ service: 1, path: 1}, {unique: true});

module.exports = {
  model: mongoose.model('Track', trackSchema),
  schema: trackSchema
};
