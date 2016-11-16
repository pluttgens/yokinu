'use strict';

const _config = require('../../config');
const express = require('express');
const Library = require('./library');

const router = express.Router();

// config will be passed to the module later
const config = _config.gmusic;
if (!config) throw new Error('No config found for module : gmusic');

const library = new Library()
  .init({
    email: config.email,
    password: config.password
  });

router
  .get('/tracks', (req, res, next) => {
    library
      .then(library => res.status(200).json(library.tracks))
      .catch(next);
  });

router
  .get('/tracks/:id', (req, res, next) => {
    library
      .then(async library => {
        var stream = await library.getStream(req.params.id);
        if (!stream) return res.sendStatus(404);
        res.set('accept-ranges', stream.headers['accept-ranges']);
        res.set('content-type', stream.headers['content-type']);
        res.set('content-length', stream.headers['content-length']);
        stream.pipe(res);
      })
      .catch(next);
  });

router
  .get('/playlists', (req, res, next) => {
    library
      .then(library => res.json(library.playLists))
      .catch(next);
  });

export default router;
