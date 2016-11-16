'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database/index');

router
  .route('/tracks')
  .get((req, res, next) => {
    (async () => {
      const tracks = await db.Track.findAsync({});
      res.json(tracks.map(track => {
        if (!track.covers) return track;
        track.covers = track.covers.map(cover => {
          return req.app.locals.static.covers + '/' + cover;
        });
        return track;
      }));
    })().catch(next);
  });

router
  .route('/tracks/:id')
  .get((req, res, next) => {
    const id = req.params.id;
    (async () => {
      const track = await db.Track.findOneAsync({
        _id: id
      });

      if (!track) return res.status(404).json({error: 'Track not found.'});
      const stream = await req.app.locals.streamProviders[track.service](track.path);
      if (!stream) return res.sendStatus(504);
      res.set('accept-ranges', 'bytes');
      res.set('content-type', 'audio/mpeg');
      res.set('content-length', stream.headers['content-length']);
      stream.pipe(res);
    })().catch(next);
  });

module.exports = router;
