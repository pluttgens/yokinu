'use strict';

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  username: {type: String, required: true},
  password: {type: String, required: true}
});

module.exports = {
  model: mongoose.model('User', userSchema),
  schema: userSchema
};
