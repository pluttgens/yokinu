'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _config = require('../../config');
var express = require('express');
var db = require('../../core/database');
var PlayMusic = require('playmusic');
var Promise = require('bluebird');
var pm = new PlayMusic();

Promise.promisifyAll(pm);

// config will be passed to the module later
var config = _config.gmusic;
if (!config) throw new Error('No config found for module : gmusic');

(0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee () {
  return _regenerator2.default.wrap(function _callee$ (_context) {
    while (1) {
      switch (_context.prev = _context.next) {
      case 0:
        _context.next = 2;
        return pm.initAsync({
          email: config.email,
          password: config.password
        });

      case 2:
      case 'end':
        return _context.stop();
      }
    }
  }, _callee, undefined);
}))().then(console.log.bind(console)).catch(console.log.bind(console));

module.exports.load = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6 () {
  var fetchTracks = (function () {
    var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3 (token, i) {
      var tracksData;
      return _regenerator2.default.wrap(function _callee3$ (_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
          case 0:
            if (!(i === LIMIT)) {
              _context3.next = 2;
              break;
            }

            return _context3.abrupt('return', []);

          case 2:
            _context3.next = 4;
            return pm.getAllTracksAsync({ nextPageToken: token });

          case 4:
            tracksData = _context3.sent;

            if (tracksData.nextPageToken) {
              _context3.next = 7;
              break;
            }

            return _context3.abrupt('return', tracksData.data.items);

          case 7:
            _context3.t0 = tracksData.data.items;
            _context3.next = 10;
            return fetchTracks(tracksData.nextPageToken, ++i);

          case 10:
            _context3.t1 = _context3.sent;
            return _context3.abrupt('return', _context3.t0.concat.call(_context3.t0, _context3.t1));

          case 12:
          case 'end':
            return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    return function fetchTracks (_x, _x2) {
      return _ref4.apply(this, arguments);
    };
  }());

  var fetchPlayLists = (function () {
    var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4 () {
      return _regenerator2.default.wrap(function _callee4$ (_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return pm.getPlayListsAsync();

          case 2:
            return _context4.abrupt('return', _context4.sent.data.items);

          case 3:
          case 'end':
            return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    return function fetchPlayLists () {
      return _ref5.apply(this, arguments);
    };
  }());

  var fetchPlayListEntries = (function () {
    var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5 (token, i) {
      var playListEntriesData;
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
            return pm.getPlayListEntriesAsync({ nextPageToken: token });

          case 4:
            playListEntriesData = _context5.sent;

            if (playListEntriesData.nextPageToken) {
              _context5.next = 7;
              break;
            }

            return _context5.abrupt('return', playListEntriesData.data.items);

          case 7:
            _context5.t0 = playListEntriesData.data.items;
            _context5.next = 10;
            return fetchTracks(playListEntriesData.nextPageToken, ++i);

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

    return function fetchPlayListEntries (_x3, _x4) {
      return _ref6.apply(this, arguments);
    };
  }());

  var LIMIT, tracks, playlists, playlistTracks, favorites;
  return _regenerator2.default.wrap(function _callee6$ (_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
      case 0:
        LIMIT = -1; // temporary constant to avoid fetching too much data.

        _context6.next = 3;
        return fetchTracks(null, 0);

      case 3:
        tracks = _context6.sent;
        _context6.next = 6;
        return fetchPlayLists();

      case 6:
        playlists = _context6.sent;
        _context6.next = 9;
        return fetchPlayListEntries(null, 0);

      case 9:
        playlistTracks = _context6.sent;
        _context6.next = 12;
        return pm.getFavoritesAsync();

      case 12:
        favorites = _context6.sent;

          // console.log(favorites);

        tracks.forEach(function (track) {
          (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2 () {
            var playlistsWithTrack, playlistTrack;
            return _regenerator2.default.wrap(function _callee2$ (_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.next = 2;
                  return db.Track.findOne({
                    service: 'gmusic',
                    path: track.id
                  });

                case 2:
                  if (!_context2.sent) {
                    _context2.next = 4;
                    break;
                  }

                  return _context2.abrupt('return', null);

                case 4:
                  playlistsWithTrack = [];
                  playlistTrack = playlistTracks.find(function (playlistTrack) {
                    return playlistTrack.trackId === track.id;
                  });

                  if (playlistTrack) {
                        // console.log(playlistTrack);
                    playlistsWithTrack = playlists.filter(function (playlist) {
                      return playlist.id == playlistTrack.playlistId;
                    }).map(function (playlist) {
                      return {
                        service: 'gmusic',
                        name: playlist.name
                      };
                    });
                        // console.log(playlistsWithTrack);
                  }

                  _context2.next = 9;
                  return db.Track.create({
                    path: track.id,
                    title: track.title,
                    artist: track.artist || track.albumArtist,
                    album: track.album,
                    duration: track.durationMillis,
                    size: track.estimatedSize,
                    genres: track.genre.split(','),
                    covers: track.artistArtRef ? track.artistArtRef.map(function (ref) {
                      return {
                        type: 'web',
                        path: ref.url
                      };
                    }) : null,
                    track: {
                      n: track.trackNumber,
                      of: track.totalTrackCount
                    },
                    disk: {
                      n: track.discNumber,
                      of: track.totalDiscCount
                    },
                    service: 'gmusic',
                    playlists: playlistsWithTrack
                  });

                case 9:
                case 'end':
                  return _context2.stop();
                }
              }
            }, _callee2, undefined);
          }))();
        });

      case 14:
      case 'end':
        return _context6.stop();
      }
    }
  }, _callee6, undefined);
}));

module.exports.getStream = (function () {
  var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7 (path) {
    return _regenerator2.default.wrap(function _callee7$ (_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
        case 0:
          return _context7.abrupt('return', pm.getStreamAsync(path));

        case 1:
        case 'end':
          return _context7.stop();
        }
      }
    }, _callee7, undefined);
  }));

  return function (_x5) {
    return _ref7.apply(this, arguments);
  };
}());
// # sourceMappingURL=index.js.map
