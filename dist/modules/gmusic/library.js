'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var fetchTracks = (function () {
  var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5 (token, i) {
    var tracksData;
    return _regenerator2.default.wrap(function _callee5$ (_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
        case 0:
          if (!(i === LIMIT)) {
            _context5.next = 2;
            break;
          }

          return _context5.abrupt('return', []);

        case 2:
          _context5.next = 4;
          return pm.getAllTracksAsync({ nextPageToken: token });

        case 4:
          tracksData = _context5.sent;

          if (tracksData.nextPageToken) {
            _context5.next = 7;
            break;
          }

          return _context5.abrupt('return', tracksData.data.items);

        case 7:
          _context5.t0 = tracksData.data.items;
          _context5.next = 10;
          return fetchTracks(tracksData.nextPageToken, ++i);

        case 10:
          _context5.t1 = _context5.sent;
          return _context5.abrupt('return', _context5.t0.concat.call(_context5.t0, _context5.t1));

        case 12:
        case 'end':
          return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function fetchTracks (_x3, _x4) {
    return _ref5.apply(this, arguments);
  };
}());

var fetchPlayLists = (function () {
  var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6 () {
    return _regenerator2.default.wrap(function _callee6$ (_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return pm.getPlayListsAsync();

        case 2:
          return _context6.abrupt('return', _context6.sent.data.items);

        case 3:
        case 'end':
          return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function fetchPlayLists () {
    return _ref6.apply(this, arguments);
  };
}());

var fetchPlayListEntries = (function () {
  var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7 (token, i) {
    var playListEntriesData;
    return _regenerator2.default.wrap(function _callee7$ (_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
        case 0:
          if (!(i === LIMIT)) {
            _context7.next = 2;
            break;
          }

          return _context7.abrupt('return', []);

        case 2:
          _context7.next = 4;
          return pm.getPlayListEntriesAsync({ nextPageToken: token });

        case 4:
          playListEntriesData = _context7.sent;

          if (playListEntriesData.nextPageToken) {
            _context7.next = 7;
            break;
          }

          return _context7.abrupt('return', playListEntriesData.data.items);

        case 7:
          _context7.t0 = playListEntriesData.data.items;
          _context7.next = 10;
          return fetchTracks(playListEntriesData.nextPageToken, ++i);

        case 10:
          _context7.t1 = _context7.sent;
          return _context7.abrupt('return', _context7.t0.concat.call(_context7.t0, _context7.t1));

        case 12:
        case 'end':
          return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function fetchPlayListEntries (_x5, _x6) {
    return _ref7.apply(this, arguments);
  };
}());

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PlayMusic = require('playmusic');
var Promise = require('bluebird');
var Track = require('./track');
var PlayList = require('./playlist');
var pm = new PlayMusic();
var db = require('../../core/database');

var LIMIT = 3; // temporary constant to avoid fetching too much data.

var Library = (function () {
  function Library () {
    (0, _classCallCheck3.default)(this, Library);
  }

  (0, _createClass3.default)(Library, [{
    key: 'init',
    value: (function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee (credentials) {
        return _regenerator2.default.wrap(function _callee$ (_context) {
          while (1) {
            switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return pm.initAsync(credentials);

            case 2:
              _context.next = 4;
              return this.refresh();

            case 4:
              return _context.abrupt('return', this);

            case 5:
            case 'end':
              return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init (_x) {
        return _ref.apply(this, arguments);
      }

      return init;
    }())
  }, {
    key: 'load',
    value: (function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2 () {
        var tracks;
        return _regenerator2.default.wrap(function _callee2$ (_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return fetchTracks();

            case 2:
              tracks = _context2.sent;

              tracks.foreach(function (track) {
                db.Track.create({
                  path: track.id,
                  title: track.title,
                  artist: track.artist || track.albumArtist,
                  album: track.album,
                  duration: track.durationMillis,
                  size: track.estimatedSize,
                  genres: track.genre.split(','),
                  covers: track.artistArtRef.map(function (ref) {
                    return {
                      type: 'web',
                      path: ref.url
                    };
                  }),
                  track: {
                    n: track.trackNumber,
                    of: track.totalTrackCount
                  },
                  disk: {
                    n: track.discNumber,
                    of: track.totalDiscCount
                  }
                });
              });

            case 4:
            case 'end':
              return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function load () {
        return _ref2.apply(this, arguments);
      }

      return load;
    }())
  }, {
    key: 'refresh',
    value: (function () {
      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3 () {
        var _this = this;

        return _regenerator2.default.wrap(function _callee3$ (_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return fetchTracks(null, 0);

            case 2:
              _context3.t0 = function (gTrack) {
                return _this.tracks[gTrack.id] = new Track(gTrack);
              };

              _context3.sent.forEach(_context3.t0);

              _context3.next = 6;
              return fetchPlayLists();

            case 6:
              _context3.t1 = function (gPlayList) {
                return _this.playLists[gPlayList.id] = new PlayList(gPlayList);
              };

              _context3.sent.forEach(_context3.t1);

              _context3.next = 10;
              return fetchPlayListEntries(null, 0);

            case 10:
              _context3.t2 = function (gPlayListEntry) {
                var track = _this.tracks[gPlayListEntry.trackId];
                if (!track) return;
                track.playListId = gPlayListEntry.playlistId;
                return track;
              };

              _context3.t3 = function (track) {
                if (!track) return;
                var playList = _this.playLists[track.playListId];
                if (!playList) return;
                playList.tracks.push(track);
              };

              _context3.sent.map(_context3.t2).forEach(_context3.t3);

            case 13:
            case 'end':
              return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function refresh () {
        return _ref3.apply(this, arguments);
      }

      return refresh;
    }())
  }, {
    key: 'getStream',
    value: (function () {
      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4 (id) {
        var track;
        return _regenerator2.default.wrap(function _callee4$ (_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
            case 0:
              track = this.tracks[id];

              if (track) {
                _context4.next = 3;
                break;
              }

              return _context4.abrupt('return');

            case 3:
              _context4.next = 5;
              return pm.getStreamAsync(id);

            case 5:
              return _context4.abrupt('return', _context4.sent);

            case 6:
            case 'end':
              return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function getStream (_x2) {
        return _ref4.apply(this, arguments);
      }

      return getStream;
    }())
  }]);
  return Library;
}());
// # sourceMappingURL=library.js.map
