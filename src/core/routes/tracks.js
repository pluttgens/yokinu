'use strict';

const config = require('../../config').yokinu;
const express = require('express');
const router = express.Router();
const db = require('../database/index');

router
  .route('/')
  .get((req, res, next) => {
    let skip = req.query.skip;
    let limit = req.query.limit;
    const q = req.query.q;

    function isInteger(i) {
      if (!i) return false;
      if (isNaN(i)) return false;
      i = Number(i);
      return i | 0 === i;
    }

    if (skip && !isInteger(skip)) return res.status(400).json({
      error: 'skip must be an integer.'
    });

    if (limit && !isInteger(limit)) return res.status(400).json({
      error: 'limit must be an integer.'
    });

    skip = Number(skip) || 0;
    limit = Math.min(Number(limit), config.low_memory ? 100 : 1000, config.low_memory ? 100 : 1000);

    console.log(limit);

    (async () => {
      let find = q ? createFindTracksQuery(q) : {};
      const tracksP = db.Track.find(find).skip(skip).limit(limit);
      const countP = db.Track.count({});
      const tracks = await
        tracksP;
      const count = await
        countP;

      res.json({
        length: tracks.length,
        next: createCursor(skip, tracks.length, count),
        data: tracks.map(track => {
          if (!track.covers) return track;
          track.covers = track.covers.map(cover => {
            return req.app.locals.static.covers + '/' + cover;
          });
          return track;
        })
      });
    })().catch(next);
  });

router
  .route('/:id/stream')
  .get((req, res, next) => {
    const id = req.params.id;
    (async () => {
      const track = await db.Track.findById({
        _id: id
      }).exec();

      if (!track) return res.status(404).json({error: 'Track not found.'});
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

function createFindTracksQuery (q) {
  const or = [];
  or.push({title: regexify(q)});
  or.push({artist: regexify(q)});
  or.push({album: regexify(q)});
  return {$or: or};
}

function regexify (q) {
  return new RegExp(q, 'i');
}

module.exports = router;
