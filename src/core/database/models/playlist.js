'use strict';

const mongoose = require('mongoose');

const playlistSchema = mongoose.Schema({
  name: {type: String, required: true},
  service: {type: String, required: true}
});

playlistSchema.index({name: 1});
playlistSchema.index({ name: 'text'});

module.exports = {
  model: mongoose.model('Playlist', playlistSchema),
  schema: playlistSchema
};
