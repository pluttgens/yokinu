'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var loadDirectory = (function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2 (dir) {
    var result;
    return _regenerator2.default.wrap(function _callee2$ (_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return dropbox.filesListFolder({
            path: dir,
            recursive: true,
            include_media_info: true
          });

        case 2:
          result = _context2.sent;
          _context2.next = 5;
          return addToDb(result.entries);

        case 5:
          if (!result.has_more) {
            _context2.next = 13;
            break;
          }

          _context2.next = 8;
          return dropbox.filesListFolderContinue({
            cursor: result.cursor
          });

        case 8:
          result = _context2.sent;
          _context2.next = 11;
          return addToDb(result.entries);

        case 11:
          _context2.next = 5;
          break;

        case 13:
        case 'end':
          return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function loadDirectory (_x) {
    return _ref2.apply(this, arguments);
  };
}());

var addToDb = (function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3 (entries) {
    var _this = this;

    var promises, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _loop, _iterator, _step, _ret;

    return _regenerator2.default.wrap(function _callee3$ (_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
        case 0:
          promises = [];
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context4.prev = 4;
          _loop = _regenerator2.default.mark(function _loop () {
            var entry, alreadyExists, download, stream, metadata, trackFromSameAlbum, picturePaths;
            return _regenerator2.default.wrap(function _loop$ (_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                case 0:
                  entry = _step.value;

                  if (!(entry['.tag'] !== 'file')) {
                    _context3.next = 3;
                    break;
                  }

                  return _context3.abrupt('return', 'continue');

                case 3:
                  console.log(entry);
                  _context3.next = 6;
                  return db.Track.findOneAsync({
                    service: 'dropbox',
                    path: entry.id
                  });

                case 6:
                  alreadyExists = _context3.sent;

                  if (!alreadyExists) {
                    _context3.next = 10;
                    break;
                  }

                  console.log('Already exists!');
                  return _context3.abrupt('return', 'continue');

                case 10:
                  _context3.next = 12;
                  return dropbox.filesGetTemporaryLink({
                    path: entry.id
                  });

                case 12:
                  download = _context3.sent;
                  _context3.next = 15;
                  return _getStream(download.link);

                case 15:
                  stream = _context3.sent;
                  metadata = void 0;
                  _context3.prev = 17;
                  _context3.next = 20;
                  return new Promise(function (resolve, reject) {
                    mm(stream, { duration: true, fileSize: download.metadata.size }, function (err, metadata) {
                      if (err) return reject(err);
                      resolve(metadata);
                    });
                  });

                case 20:
                  metadata = _context3.sent;
                  _context3.next = 26;
                  break;

                case 23:
                  _context3.prev = 23;
                  _context3.t0 = _context3['catch'](17);
                  return _context3.abrupt('return', 'continue');

                case 26:
                  stream.destroy();
                  trackFromSameAlbum = void 0;

                  if (!(metadata.artist.join(', ') && metadata.album && metadata.artist.join(',') !== 'Unknown' && metadata.album !== 'Unknown')) {
                    _context3.next = 32;
                    break;
                  }

                  _context3.next = 31;
                  return db.Track.findOneAsync({
                    artist: metadata.artist.join(', '),
                    album: metadata.album
                  });

                case 31:
                  trackFromSameAlbum = _context3.sent;

                case 32:
                  picturePaths = void 0;

                  if (!(trackFromSameAlbum && trackFromSameAlbum.covers)) {
                    _context3.next = 37;
                    break;
                  }

                  picturePaths = trackFromSameAlbum.covers;
                  _context3.next = 40;
                  break;

                case 37:
                  _context3.next = 39;
                  return Promise.all(metadata.picture.map(function (pic) {
                    return db.Cover.save(pic.format, pic.data);
                  }));

                case 39:
                  picturePaths = _context3.sent;

                case 40:
                  promises.push(db.Track.insertAsync({
                    title: metadata.title || 'Unknown',
                    artist: metadata.artist.join(', ') || 'Unknown',
                    album: metadata.album,
                    duration: metadata.duration,
                    track: metadata.track,
                    disk: metadata.disk,
                    genre: metadata.genre,
                    covers: picturePaths,
                    service: 'dropbox',
                    path: entry.id
                  }));

                case 41:
                case 'end':
                  return _context3.stop();
                }
              }
            }, _loop, _this, [[17, 23]]);
          });
          _iterator = (0, _getIterator3.default)(entries);

        case 7:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context4.next = 15;
            break;
          }

          return _context4.delegateYield(_loop(), 't0', 9);

        case 9:
          _ret = _context4.t0;

          if (!(_ret === 'continue')) {
            _context4.next = 12;
            break;
          }

          return _context4.abrupt('continue', 12);

        case 12:
          _iteratorNormalCompletion = true;
          _context4.next = 7;
          break;

        case 15:
          _context4.next = 21;
          break;

        case 17:
          _context4.prev = 17;
          _context4.t1 = _context4['catch'](4);
          _didIteratorError = true;
          _iteratorError = _context4.t1;

        case 21:
          _context4.prev = 21;
          _context4.prev = 22;

          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }

        case 24:
          _context4.prev = 24;

          if (!_didIteratorError) {
            _context4.next = 27;
            break;
          }

          throw _iteratorError;

        case 27:
          return _context4.finish(24);

        case 28:
          return _context4.finish(21);

        case 29:
          _context4.next = 31;
          return Promise.all(promises);

        case 31:
        case 'end':
          return _context4.stop();
        }
      }
    }, _callee3, this, [[4, 17, 21, 29], [22,, 24, 28]]);
  }));

  return function addToDb (_x2) {
    return _ref3.apply(this, arguments);
  };
}());

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Dropbox = require('dropbox');
var Promise = require('bluebird');
var config = require('../../config');
var db = require('../../core/index').db;
var https = require('https');
var mm = require('musicmetadata');

var dropbox = new Dropbox({
  accessToken: config.dropbox.token
});

module.exports.load = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee () {
  var i;
  return _regenerator2.default.wrap(function _callee$ (_context) {
    while (1) {
      switch (_context.prev = _context.next) {
      case 0:
        i = 0;

      case 1:
        if (!(i < config.dropbox.directories.length)) {
          _context.next = 7;
          break;
        }

        _context.next = 4;
        return loadDirectory(config.dropbox.directories[i]);

      case 4:
        i++;
        _context.next = 1;
        break;

      case 7:
      case 'end':
        return _context.stop();
      }
    }
  }, _callee, undefined);
}));

module.exports.getStream = (function () {
  var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4 (id) {
    var download;
    return _regenerator2.default.wrap(function _callee4$ (_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return dropbox.filesGetTemporaryLink({
            path: id
          });

        case 2:
          download = _context5.sent;
          return _context5.abrupt('return', _getStream(download.link));

        case 4:
        case 'end':
          return _context5.stop();
        }
      }
    }, _callee4, this);
  }));

  return function (_x3) {
    return _ref4.apply(this, arguments);
  };
}());

function _getStream (link) {
  return new Promise(function (resolve) {
    https.get(link, function (response) {
      resolve(response);
    });
  });
}
// # sourceMappingURL=index.js.map
