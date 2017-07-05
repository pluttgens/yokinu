'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Snowflake = require('node-snowflake');
var Promise = require('bluebird');
var worker = new Snowflake.Worker({ retry: true });
var fs = Promise.promisifyAll(require('fs'));
var config = require('../config.json');
var mkdirp = require('mkdirp');

try {
  mkdirp.sync(config.coverPath);
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

module.exports.save = (function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee (format, data) {
    var filename;
    return _regenerator2.default.wrap(function _callee$ (_context) {
      while (1) {
        switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return worker.getId();

        case 2:
          _context.t0 = _context.sent;
          _context.t1 = _context.t0 + '.';
          _context.t2 = format;
          filename = _context.t1 + _context.t2;
          _context.next = 8;
          return fs.writeFileAsync(config.coverPath + filename, data);

        case 8:
          return _context.abrupt('return', filename);

        case 9:
        case 'end':
          return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());

module.exports.get = (function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2 (filename) {
    return _regenerator2.default.wrap(function _callee2$ (_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return fs.readFileAsync(config.coverPath + filename);

        case 2:
          return _context2.abrupt('return', _context2.sent);

        case 3:
        case 'end':
          return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x3) {
    return _ref2.apply(this, arguments);
  };
}());
// # sourceMappingURL=cover.js.map
