'use strict';

const PlayMusic = require('playmusic');
const Promise = require('bluebird');
const Track = require('./track');
const PlayList = require('./playlist');
const pm = new PlayMusic();
const db = require('../../core/database');


const LIMIT = 3; // temporary constant to avoid fetching too much data.

class Library {
  constructor () {
  }

  async init (credentials) {
    await pm.initAsync(credentials);
    await this.refresh();
    return this;
  }

  async load () {
    let tracks = await fetchTracks();
    tracks.foreach(track => {
      db.Track.create({
        path: track.id,
        title: track.title,
        artist: track.artist || track.albumArtist,
        album: track.album,
        duration: track.durationMillis,
        size: track.estimatedSize,
        genres: track.genre.split(','),
        covers: track.artistArtRef.map(ref => ({
          type: 'web',
          path: ref.url
        })),
        track: {
          n: track.trackNumber,
          of: track.totalTrackCount
        },
        disk: {
          n: track.discNumber,
          of: track.totalDiscCount
        }
      })
    })
  }

  async refresh () {
    (await fetchTracks(null, 0)).forEach(gTrack => (this.tracks[gTrack.id] = new Track(gTrack)));
    (await fetchPlayLists()).forEach(gPlayList => (this.playLists[gPlayList.id] = new PlayList(gPlayList)));
    (await fetchPlayListEntries(null, 0))
      .map(gPlayListEntry => {
        var track = this.tracks[gPlayListEntry.trackId];
        if (!track) return;
        track.playListId = gPlayListEntry.playlistId;
        return track;
      })
      .forEach(track => {
        if (!track) return;
        var playList = this.playLists[track.playListId];
        if (!playList) return;
        playList.tracks.push(track);
      });
  }

  async getStream (id) {
    var track = this.tracks[id];
    if (!track) return;
    return await pm.getStreamAsync(id);
  }
}

async function fetchTracks (token, i) {
  if (i === LIMIT) return [];
  let tracksData = await pm.getAllTracksAsync({nextPageToken: token});
  if (!tracksData.nextPageToken) return tracksData.data.items;
  return tracksData.data.items.concat(await fetchTracks(tracksData.nextPageToken, ++i));
}

async function fetchPlayLists () {
  return (await pm.getPlayListsAsync()).data.items;
}

async function fetchPlayListEntries (token, i) {
  if (i === LIMIT) return [];
  var playListEntriesData = await pm.getPlayListEntriesAsync({nextPageToken: token});
  if (!playListEntriesData.nextPageToken) return playListEntriesData.data.items;
  return playListEntriesData.data.items.concat(await fetchTracks(playListEntriesData.nextPageToken, ++i));
}
