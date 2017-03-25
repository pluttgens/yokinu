'use strict';

const config = require('../../config').yokinu;
const express = require('express');
const router = express.Router();
const db = require('../database/index');
const validator = require('validator');

router
  .route('/')
  .get((req, res, next) => {
    let skip = req.query.skip;
    let limit = req.query.limit;
    const q = req.query.q;

    if (skip && !isInteger(skip)) return res.status(400).json({
      error: 'skip must be an integer.'
    });

    if (limit && !isInteger(limit)) return res.status(400).json({
      error: 'limit must be an integer.'
    });

    skip = Number(skip) || 0;
    limit = Math.min(Number(limit), config.low_memory ? 100 : 1000);

    (async () => {
      const tracksP = db.Track
        .find({ $text: { $search: q } },
          { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit);
      const countP = db.Track.count({});
      const tracks = await tracksP;
      const count = await countP;

      console.log(mapCovers(tracks));
      return res.json({
        length: tracks.length,
        next: createCursor(skip, tracks.length, count),
        data: mapCovers(tracks)
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
      const track = await db.Track.findById({
        _id: id
      }).exec();

      if (!track) return res.status(404).json({ error: 'Track not found.' });

      return res.json({
        length: 1,
        data: mapCovers([track])[0]
      })
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
      return res.json({
        data: await db.Track.findById(id)
      });
    })().catch(next);
  });


router
  .route('/bulk_get')
  .post((req, res, next) => {
    const ids = req.body.ids;

    (async () => {
      const data = ids.map(id => {
        return (async () => {
          if (!validator.isMongoId(id)) return Promise.reject('invalid id format.');
          return db.Track.findById(id);
        })();
      });

      return Promise
        .all(data)
        .then(data => {
          return res.json({
            data: data
          });
        })
        .catch(err => {
          return res.status(400).json({
            error: 'invalid id format'
          })
        });
    })().catch(next);
  });

router
  .route('/:id/stream')
  .get((req, res, next) => {
    const id = req.params.id;

    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        error: 'invalid id format.'
      })
    }

    (async () => {
      const track = await db.Track.findById({
        _id: id
      }).exec();

      if (!track) return res.status(404).json({ error: 'Track not found.' });
      const stream = await req.app.locals.services[track.service].getStream(track.path);
      if (!stream) return res.sendStatus(504);
      res.set('accept-ranges', 'bytes');
      res.set('content-type', 'audio/mpeg');
      res.set('content-length', stream.headers['content-length']);
      stream.pipe(res);
    })().catch(next);
  });

function createCursor (skip, fetched, count) {
  if (!fetched || !count) return;
  let lastElem = fetched;
  if (skip) lastElem += skip;
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

function isInteger (i) {
  if (!i) return false;
  if (isNaN(i)) return false;
  i = Number(i);
  return i | 0 === i;
}

module.exports = router;
