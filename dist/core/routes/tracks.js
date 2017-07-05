'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promise = require('bluebird');
var express = require('express');
var router = express.Router();
var db = require('../database/index');

router.route('/').get(function (req, res, next) {
  var skip = Number(req.query.skip);
  var limit = Number(req.query.limit);
  var q = req.query.q;

  if (skip && (skip | 0) !== skip) {
    return res.status(400).json({
      error: 'skip must be an integer.'
    });
  }

  if (limit && (limit | 0) !== limit) {
    return res.status(400).json({
      error: 'limit must be an integer.'
    });
  }

  (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee () {
    var find, tracksP, countP, tracks, count;
    return _regenerator2.default.wrap(function _callee$ (_context) {
      while (1) {
        switch (_context.prev = _context.next) {
        case 0:
          find = q ? createFindTracksQuery(q) : {};
          tracksP = db.Track.find(find).skip(skip).limit(limit);
          countP = db.Track.count({});
          _context.next = 5;
          return tracksP;

        case 5:
          tracks = _context.sent;
          _context.next = 8;
          return countP;

        case 8:
          count = _context.sent;

          res.json({
            data: tracks.map(function (track) {
              if (!track.covers) return track;
              track.covers = track.covers.map(function (cover) {
                return req.app.locals.static.covers + '/' + cover;
              });
              return track;
            }),
            next: createCursor(skip, tracks.length, count)
          });

        case 10:
        case 'end':
          return _context.stop();
        }
      }
    }, _callee, undefined);
  }))().catch(next);
});

router.route('/:id/stream').get(function (req, res, next) {
  var id = req.params.id;
  (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2 () {
    var track, stream;
    return _regenerator2.default.wrap(function _callee2$ (_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return db.Track.findById({
            _id: id
          }).exec();

        case 2:
          track = _context2.sent;

          if (track) {
            _context2.next = 5;
            break;
          }

          return _context2.abrupt('return', res.status(404).json({ error: 'Track not found.' }));

        case 5:
          _context2.next = 7;
          return req.app.locals.services[track.service].getStream(track.path);

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

function createCursor (skip, fetched, count) {
  if (!fetched || !count) return;
  var lastElem = fetched;
  if (skip) lastElem += skip;
  if (lastElem >= count) return;
  return lastElem;
}

function createFindTracksQuery (q) {
  var or = [];
  or.push({ title: regexify(q) });
  or.push({ artist: regexify(q) });
  or.push({ album: regexify(q) });
  return { $or: or };
}

function regexify (q) {
  return new RegExp(q, 'i');
}

module.exports = router;
// # sourceMappingURL=tracks.js.map
