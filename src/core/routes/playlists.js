'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

router
  .route('/')
  .get((req, res, next) => {
    (async () => {
      const tracks = await db.Track.find({
        playlists: {
          $exists: true,
          $ne: []
        }
      });

      const playlists = tracks.reduce((prev, curr) => {
        curr.playlists.forEach(playlist => {
          const playlistName = playlist.service + ' ' + playlist.name;
          if (!prev[playlistName]) prev[playlistName] = [];
          prev[playlistName].push(curr);
        });
        return prev;
      }, {});

      return res.json({
        data: playlists
      });
    })().catch(next);
  });

module.exports = router;
