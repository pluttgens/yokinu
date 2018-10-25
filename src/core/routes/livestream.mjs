import path from 'path';
import express from 'express';
import HttpError from 'http-errors';
import liveStream from '../livestream/index.mjs';
import Check from 'express-validator/check';
import Filter from 'express-validator/filter';
import { operationalLogger } from '../loggers/index.mjs';
import db from '../database/index';

const router = express.Router();

const { check, param, checkSchema, validationResult } = Check;
const { matchedData } = Filter;

const HLS_EXTS = {
  M3U8: '.m3u8',
  TS: '.ts'
};
const HLS_EXTS_LIST = Object.values(HLS_EXTS);

router
  .route('/')
  .get((req, res, next) => {
    res.json({ liveStream });
  })
  .post([
    check('shuffle')
      .isBoolean()
      .optional({ nullable: true }),
    check('all')
      .isBoolean()
      .optional({ nullable: true })
  ], (req, res, next) => {
    (async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpError.BadRequest({ errors: errors.mapped() });
      }

      const options = matchedData(req);

      const queued = await liveStream.startStream(options);
      return res.json({
        queued: queued.map(track => track.title)
      });
    })().catch(next);
  });

router
  .route('/tracks/:trackId')
  .get(checkSchema({}), (req, res, next) => {
    res.json({ tracks: liveStream.queue.data });
  })
  .post([
    param('trackId')
  ], (req, res, next) => {
    (async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpError.BadRequest({ errors: errors.mapped() });
      }

      const { trackId } = matchedData(req);

      const track = await db.track.findById(trackId, {
        include: [
          { model: db.artist, as: 'artist' },
          { model: db.album, as: 'album' },
          { model: db.genre, as: 'genres' }
        ]
      });
      if (!track) throw new HttpError.NotFound('No track found for that id.');
      await liveStream.queueTrack(track);
      return res.json({ tracks: liveStream.queue });
    })().catch(next);
  });

router
  .route('/playlists/:playlistId')
  .get(checkSchema({}), (req, res, next) => {
    res.json({ tracks: liveStream.queue.data });
  })
  .post([
    param('playlistId')
  ], (req, res, next) => {
    (async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpError.BadRequest({ errors: errors.mapped() });
      }

      const { playlistId } = matchedData(req);
      const playlist = await db.playlist.findById(playlistId, {
        include: [
          { model: db.track, as: 'tracks' }
        ]
      });
      if (!playlist) throw new HttpError.NotFound('No playlist found for that id.');
      await liveStream.queuePlaylist(playlist);
      return res.json({ tracks: liveStream.queue });
    })().catch(next);
  });

router
  .route('/hls/:file')
  .get((req, res, next) => {
    const fileName = req.params.file;
    const fileExt = path.extname(fileName);
    if (!HLS_EXTS_LIST.find(ext => ext === fileExt)) {
      return next(new HttpError.BadRequest(`Accepted file extentions are ${HLS_EXTS_LIST}`));
    }

    (async () => {
      const headers = {};

      switch (fileExt) {
        case HLS_EXTS.M3U8:
          headers['Content-Type'] = 'application/vnd.apple.mpegurl';
          break;
        case HLS_EXTS.TS:
          headers['Content-Type'] = 'audio/mp2t';
          break;
      }
      res.set(headers);

      const file = await liveStream.getFile(fileName);
      file.on('error', err => {
        file.close();
        if (err.code === 'ENOENT') {
          operationalLogger.error(err);
          return next(new HttpError.NotFound('File not found.'));
        }
        return next(err);
      });
      file.pipe(res);
    })().catch(next);
  });

router
  .route('/status')
  .get((req, res, next) => {
    return res.json({
      track: liveStream.current,
      timemark: liveStream.timeMark
    });
  });

router
  .route('/skip')
  .post((req, res, next) => {
    try {
      liveStream.skip();
      return res.json({ message: 'skipped' });
    } catch (err) {
      next(err);
    }
  });

export default router;
