'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var express = require('express');
var router = express.Router();
var db = require('../database/index');

router.route('/tracks').get(function (req, res, next) {
  (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee () {
    var tracks;
    return _regenerator2.default.wrap(function _callee$ (_context) {
      while (1) {
        switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return db.Track.findAsync({});

        case 2:
          tracks = _context.sent;

          res.json(tracks.map(function (track) {
            if (!track.covers) return track;
            track.covers = track.covers.map(function (cover) {
              return req.app.locals.static.covers + '/' + cover;
            });
            return track;
          }));

        case 4:
        case 'end':
          return _context.stop();
        }
      }
    }, _callee, undefined);
  }))().catch(next);
});

router.route('/tracks/:id').get(function (req, res, next) {
  var id = req.params.id;
  (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2 () {
    var track, stream;
    return _regenerator2.default.wrap(function _callee2$ (_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return db.Track.findOneAsync({
            _id: id
          });

        case 2:
          track = _context2.sent;

          if (track) {
            _context2.next = 5;
            break;
          }

          return _context2.abrupt('return', res.status(404).json({ error: 'Track not found.' }));

        case 5:
          _context2.next = 7;
          return req.app.locals.streamProviders[track.service](track.path);

        case 7:
          stream = _context2.sent;

          if (stream) {
            _context2.next = 10;
            break;
          }

          return _context2.abrupt('return', res.sendStatus(504));

        case 10:
          res.set('accept-ranges', 'bytes');
          res.set('content-type', 'audio/mpeg');
          res.set('content-length', stream.headers['content-length']);
          stream.pipe(res);

        case 14:
        case 'end':
          return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }))().catch(next);
});

module.exports = router;
// # sourceMappingURL=tracks.js.map
