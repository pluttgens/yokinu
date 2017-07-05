'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function PlayList (gPlayList) {
  (0, _classCallCheck3.default)(this, PlayList);

  this.id = gPlayList.id;
  this.name = gPlayList.name;
  this.owner = gPlayList.ownerName;
  this.tracks = [];
};
// # sourceMappingURL=playlist.js.map
