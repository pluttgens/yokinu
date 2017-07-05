'use strict';

var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }
});

module.exports = {
  model: mongoose.model('User', userSchema),
  schema: userSchema
};
// # sourceMappingURL=user.js.map
