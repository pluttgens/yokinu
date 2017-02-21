'use strict';

const _config = require('../../config');
const express = require('express');
const db = require('../../core/database');
const PlayMusic = require('playmusic');
const Promise = require('bluebird');
const pm = new PlayMusic();

Promise.promisifyAll(pm);

// config will be passed to the module later
const config = _config.gmusic;
if (!config) throw new Error('No config found for module : gmusic');

(async () => {
  await pm.initAsync({
    email: config.email,
    password: config.password
  });
})().then(console.log.bind(console)).catch(console.log.bind(console));

module.exports.load = async () => {
  const LIMIT = 0; // temporary constant to avoid fetching too much data.

  const tracks = await fetchTracks(null, 0);
  const playlists = await fetchPlayLists();
  const playlistTracks = await fetchPlayListEntries(null, 0);
  const favorites = await pm.getFavoritesAsync();
  //console.log(favorites);

  tracks.forEach(track => {
    (async () => {
      if (await db.Track.findOne({
          service: 'gmusic',
          path: track.id
        })) return null;

      let playlistsWithTrack = [];
      const playlistTrack = playlistTracks.find(playlistTrack => playlistTrack.trackId === track.id);
      if (playlistTrack) {
        //console.log(playlistTrack);
        playlistsWithTrack = playlists
          .filter(playlist => playlist.id == playlistTrack.playlistId)
          .map(playlist => ({
            service: 'gmusic',
            name: playlist.name
          }));
        //console.log(playlistsWithTrack);
      }

      await db.Track.create({
        path: track.id,
        title: track.title,
        artist: track.artist || track.albumArtist,
        album: track.album,
        duration: track.durationMillis,
        size: track.estimatedSize,
        genres: track.genre.split(','),
        covers: track.artistArtRef ? track.artistArtRef.map(ref => ({
            type: 'web',
            path: ref.url
          })) : null,
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
    })();
  });

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
    let playListEntriesData = await pm.getPlayListEntriesAsync({nextPageToken: token});
    if (!playListEntriesData.nextPageToken) return playListEntriesData.data.items;
    return playListEntriesData.data.items.concat(await fetchTracks(playListEntriesData.nextPageToken, ++i));
  }
};

module.exports.getStream = async (path) => {
  return pm.getStreamAsync(path);
};
