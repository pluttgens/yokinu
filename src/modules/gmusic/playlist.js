'use strict';

module.exports = class PlayList {
  constructor (gPlayList) {
    this.id = gPlayList.id;
    this.name = gPlayList.name;
    this.owner = gPlayList.ownerName;
    this.tracks = [];
  }
}
