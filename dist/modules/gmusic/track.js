'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = (function () {
  function Track (track) {
    (0, _classCallCheck3.default)(this, Track);

    this.id = track.id;
    this.title = track.title;
    this.artist = track.artist || track.albumArtist;
    this.album = track.album;
    this.duration = track.durationMillis;
    this.size = track.estimatedSize;
  }

  (0, _createClass3.default)(Track, [{
    key: 'getStream',
    value: function getStream () {}
  }]);
  return Track;
}());
// # sourceMappingURL=track.js.map
