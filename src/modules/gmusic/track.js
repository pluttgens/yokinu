'use strict';

module.exports = class Track {
  constructor (track) {
    this.id = track.id;
    this.title = track.title;
    this.artist = track.artist || track.albumArtist;
    this.album = track.album;
    this.duration = track.durationMillis;
    this.size = track.estimatedSize;
  }

  getStream () {

  }
}
