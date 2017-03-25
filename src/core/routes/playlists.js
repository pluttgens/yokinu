'use strict';

const express = require('express');
const router = express.Router();
const Promise = require('bluebird');
const validator = require('validator');
const db = require('../database');

router
  .route('/')
  .get((req, res, next) => {
    const service = req.query.service;

    const query = {
      playlists: {
        $exists: true,
        $ne: []
      }
    };

    if (service) {
      query.playlists.$elemMatch = {
        service: service
      };
    }

    (async () => {
      const playlists = await db.Playlist.find({});

      const data = {};
      const promises = [];

      playlists.forEach(playlist => {
        promises.push((async () => {
          data[playlist.id] = {
            name: playlist.name,
            service: playlist.service,
            tracks: await db.Track.find({
              playlists: {
                $elemMatch: {
                  name: playlist.name,
                  service: playlist.service
                }
              }
            })
          };
        })().catch(console.log.bind(console)));
      });

      return Promise.all(promises).then(() => {
        return res.json({
          data: data
        });
      });
    })().catch(next);
  });


router
  .route('/:id')
  .get((req, res, next) => {
    const id = req.params.id;

    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        error: 'invalid id format.'
      })
    }

    (async () => {
      const playlist = await db.Playlist.findById(id);

      if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

      const tracks = await db.Track.find({
        playlists: {
          $elemMatch: {
            name: playlist.name,
            service: playlist.service
          }
        }
      });

      return res.json({
        data: {
          _id: playlist.id,
          name: playlist.name,
          service: playlist.service,
          tracks: tracks
        }
      });
    })().catch(next);
  });

module.exports = router;
