import path from 'path';
import express from 'express';
import mime from 'mime-types';
import HttpError from 'http-errors';
import liveStream from '../livestream/index.mjs';
import { operationalLogger } from '../loggers/index.mjs';

const router = express.Router();
const HLS_EXTS = {
  M3U8: '.m3u8',
  TS: '.ts'
};
const HLS_EXTS_LIST = Object.values(HLS_EXTS);

router
  .route('/')
  .get((req, res, next) => {
    req.connection.setKeepAlive(true);
    if (!liveStream.isStarted) return next(new HttpError.Forbidden('Livestream stopped.'));
    const contentType = mime.lookup(liveStream.current.path);
    operationalLogger.debug(`Content-Type for ${liveStream.current} : ${contentType}`);
    res.set('Content-Type', 'audio/mpeg');
    res.set('Transfer-Encoding', 'chunked');
    res.set('keep-alive', 'timeout=10, max=100');

    liveStream.pipe(res);
  })
  .post((req, res, next) => {
    (async () => {
      const queued = await liveStream.startStream();
      return res.json({
        queued: queued.map(track => track.title)
      });
    })().catch(next);
  });

router
  .route('/:file')
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
