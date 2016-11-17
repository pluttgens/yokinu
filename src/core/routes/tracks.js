'use strict';

const Promise = require('bluebird');
const express = require('express');
const router = express.Router();
const db = require('../database/index');

router
  .route('/')
  .get((req, res, next) => {
    const skip = Number(req.query.skip);
    const limit = Number(req.query.limit);
    const q = req.query.q;

    if (skip && (skip | 0) !== skip) return res.status(400).json({
      error: 'skip must be an integer.'
    });
    
    if (limit && (limit | 0) !== limit) return res.status(400).json({
      error: 'limit must be an integer.'
    });

    (async () => {
      let find = q ? createFindTracksQuery(q) : {};
      console.log(find)
      const query = db.Track.find(find).skip(skip).limit(limit);
      const tracksP = Promise.promisify(query.exec, {context: query})();
      const countP = db.Track.countAsync({});
      const tracks = await tracksP;
      const count = await countP;

      res.json({
        data: tracks.map(track => {
          if (!track.covers) return track;
          track.covers = track.covers.map(cover => {
            return req.app.locals.static.covers + '/' + cover;
          });
          return track;
        }),
        next: createCursor(skip, tracks.length, count)
      });
    })().catch(next);
  });

router
  .route('/:id')
  .get((req, res, next) => {
    const id = req.params.id;
    (async () => {
      const track = await db.Track.findOneAsync({
        _id: id
      });

      if (!track) return res.status(404).json({error: 'Track not found.'});
      const stream = await req.app.locals.services[track.service].getStream(track.path);
      if (!stream) return res.sendStatus(504);
      res.set('accept-ranges', 'bytes');
      res.set('content-type', 'audio/mpeg');
      res.set('content-length', stream.headers['content-length']);
      stream.pipe(res);
    })().catch(next);
  });

function createCursor(skip, fetched, count) {
  if (!fetched || !count) return;
  let lastElem = fetched;
  if (skip) lastElem += skip;
  if (lastElem >= count) return;
  return lastElem;
}

function createFindTracksQuery(q) {
  const or = [];
  or.push({title: regexify(q)});
  or.push({artist: regexify(q)});
  or.push({album: regexify(q)});
  return {$or: or};
}

function regexify(q) {
  return  new RegExp(q, 'i');
}

module.exports = router;
