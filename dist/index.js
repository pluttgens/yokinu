'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var http = require('http');
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');
var Promise = require('bluebird');
var path = require('path');
var routes = require('./core/routes/index');

(0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee () {
  var app, services, promises, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, serviceName, apiPrefix, port, server;

  return _regenerator2.default.wrap(function _callee$ (_context) {
    while (1) {
      switch (_context.prev = _context.next) {
      case 0:
        app = express();

        app.disable('etag');
        app.use(logger('dev'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(cors());

        services = ['gmusic'];

        app.locals.services = {};
        promises = [];

        console.log('Loading services...');
        _iteratorNormalCompletion = true;
        _didIteratorError = false;
        _iteratorError = undefined;
        _context.prev = 13;
        for (_iterator = (0, _getIterator3.default)(services); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          serviceName = _step.value;

          app.locals.services[serviceName] = require('./modules/' + serviceName);
        }

        _context.next = 21;
        break;

      case 17:
        _context.prev = 17;
        _context.t0 = _context['catch'](13);
        _didIteratorError = true;
        _iteratorError = _context.t0;

      case 21:
        _context.prev = 21;
        _context.prev = 22;

        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }

      case 24:
        _context.prev = 24;

        if (!_didIteratorError) {
          _context.next = 27;
          break;
        }

        throw _iteratorError;

      case 27:
        return _context.finish(24);

      case 28:
        return _context.finish(21);

      case 29:
        _context.next = 31;
        return Promise.all(promises);

      case 31:
        console.log('Services loaded!');

        apiPrefix = '/api';

        app.locals.static = {
          covers: '/static/covers'
        };

        app.use(app.locals.static.covers, express.static(path.join(__dirname, '..', 'data', 'covers')));

        app.use(apiPrefix + '/playlists', routes.playlists);
        app.use(apiPrefix + '/services', routes.services);
        app.use(apiPrefix + '/tracks', routes.tracks);

        app.use(function (err, req, res, next) {
          console.log(err);
          res.send(err.stack);
        });

        port = process.env.PORT || 4100;
        server = http.createServer(app);

        server.listen(port);
        console.log('listening on port ' + port);

      case 43:
      case 'end':
        return _context.stop();
      }
    }
  }, _callee, undefined, [[13, 17, 21, 29], [22,, 24, 28]]);
}))().catch(function (err) {
  console.log(err);
  throw err;
});
// # sourceMappingURL=index.js.map
