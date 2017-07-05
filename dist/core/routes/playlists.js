'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var express = require('express');
var router = express.Router();
var db = require('../database');

router.route('/').get(function (req, res, next) {
  (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee () {
    var tracks, playlists;
    return _regenerator2.default.wrap(function _callee$ (_context) {
      while (1) {
        switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return db.Track.find({
            playlists: {
              $exists: true,
              $ne: []
            }
          });

        case 2:
          tracks = _context.sent;
          playlists = tracks.reduce(function (prev, curr) {
            curr.playlists.forEach(function (playlist) {
              var playlistName = playlist.service + ' ' + playlist.name;
              if (!prev[playlistName]) prev[playlistName] = [];
              prev[playlistName].push(curr);
            });
            return prev;
          }, {});
          return _context.abrupt('return', res.json({
            data: playlists
          }));

        case 5:
        case 'end':
          return _context.stop();
        }
      }
    }, _callee, undefined);
  }))().catch(next);
});

module.exports = router;
// # sourceMappingURL=playlists.js.map
