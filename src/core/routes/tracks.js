'use strict';

const config = require('config');
const express = require('express');
const router = express.Router();
const db = require('../database/index');
const validator = require('validator');
import {trackController} from '../controllers'

router
  .route('/')
  .get((req, res, next) => {
    const skip = req.query.skip;
    const limit = req.query.limit;
    const q = req.query.q;

    (async () => {
      const results = await trackController.findTracks(q, skip, limit);

      return res.json({
        length: results.tracks.length,
        next: createCursor(skip, results.tracks.length, results.total),
        data: mapCovers(results.tracks)
      });
    })().catch(next);
  });

router
  .route('/:id')
  .get((req, res, next) => {
    const id = req.params.id;

    (async () => {
      return res.json({
        length: 1,
        data: mapCovers([await controllers.tracks.getTrack(id)])[0]
      });
    })().catch(next);
  });

router
  .route('/bulk_get')
  .get((req, res, next) => {
    const ids = req.query.ids.split(',');

    (async () => {
      const tracks = await controllers.tracks.getTracksById(ids);
      return {
        length: tracks.length,
        data: mapCovers(tracks)
      }
    })().catch(next);
  })
  .post((req, res, next) => {
    const ids = req.body.ids;

    (async () => {
      const tracks = await controllers.tracks.getTracksById(ids);
      return {
        length: tracks.length,
        data: mapCovers(tracks)
      }
    })().catch(next);
  });

router
  .route('/:id/stream')
  .get((req, res, next) => {
    const id = req.params.id;

    (async () => {
      const track = await trackController.getTrack(id);

      if (!track) return res.status(404).json({ error: 'Track not found.' });
      const stream = await req.app.locals.services[track.service_id].getStream(track.path);
      if (!stream) return res.sendStatus(504);
      res.set('accept-ranges', 'bytes');
      res.set('content-type', 'audio/mpeg');
      res.set('content-length', stream.headers['content-length']);
      stream.pipe(res);
    })().catch(next);
  });

function createCursor (skip, fetched, count) {
  if (!fetched || !count) return;
  let lastElem = Number(fetched);
  if (skip) lastElem += Number(skip);
  if (lastElem >= count) return;
  return lastElem;
}

function mapCovers (tracks) {
  return tracks.map(track => {
    if (!track.covers) return track;
    track.covers = track.covers.map(cover => {
      if (cover.type === 'local')
        return req.app.locals.static.covers + '/' + cover;
      return cover;
    });
    return track;
  });
}

module.exports = router;
