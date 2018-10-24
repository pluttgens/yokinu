import config from 'config';
import express from 'express';
import formidable from 'formidable';
import db from '../database/index.mjs';
import { operationalLogger } from '../loggers/index.mjs';
import { dbCall } from '../helpers/wrappers.mjs';
import { serviceManager } from '../services/index.mjs'
import HttpError from 'http-errors';
import mime from 'mime-types';
import Check from 'express-validator/check';
import Filter from 'express-validator/filter';

const router = express.Router();

const { query, checkSchema, validationResult } = Check;
const { matchedData } = Filter;


router
  .route('/')
  .get([
      query('limit')
        .isInt({ min: 0, max: config.search.limit })
        .optional({ nullable: true }),
      query('q')
        .optional({ nullable: true })],
    (req, res, next) => {
      (async () => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new HttpError.BadRequest({ errors: errors.mapped() });
        }

        const { limit, q } = matchedData(req);

        const results = await db.track.textSearch(q, 0, limit);

        return res.json({
          length: results.tracks.length,
          next: null,// createCursor(0, results.tracks.length, results.total),
          data: results.tracks
        });
      })().catch(next);
    });


router
  .route('/:serviceId')
  .post((req, res, next) => {
    const serviceId = req.params.serviceId;
    const service = serviceManager.get(serviceId);

    if (!service) {
      throw new HttpError.NotFound(`${serviceId} is not a service.`);
    }

    const form = formidable.IncomingForm();
    form.uploadDir = config.yokinu.temp_data;
    form.keepExtensions = true;

    form.on('file', async (name, file) => {
      operationalLogger.debug(`New ${name} uploaded : ${JSON.stringify(file)}`);
      (async () => {
        const track = await service.putTrack(file.path, { size: file.size, mime: file.type, requestId: req.id });
        return res.status(201).json({ track });
      })().catch(next);
    });

    form.on('error', err => {
      return next(err);
    });

    form.parse(req);
  });

router
  .route('/:id')
  .get((req, res, next) => {
    const id = req.params.id;

    (async () => {
      operationalLogger.info('GET TRACK : ' + id);
      const track = await dbCall(db.track.findById(id));
      if (!track) {
        throw new HttpError(404, 'No track found.');
      }

      return res.json({
        length: 1,
        data: mapCovers(track)
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
      const track = await db.track.findById(id);
      if (!track) throw HttpError.NotFound('Track not found.');
      operationalLogger.info(`Streaming ${track} to client.`);
      const stream = await serviceManager.get(track.service_id).getStream(track);
      if (!stream) throw new HttpError.InternalServerError("Could not load stream.");
      res.set('accept-ranges', 'bytes');
      res.set('content-type', mime.lookup(track.format));
      res.set('content-length', track.size);
      res.set('content-disposition', `${track.title}.${track.format}`);

      stream.pipe(res);
    })().catch(next);
  });

function createCursor(skip, fetched, count) {
  if (!fetched || !count) return;
  let lastElem = Number(fetched);
  if (skip) lastElem += Number(skip);
  if (lastElem >= count) return;
  return lastElem;
}

function mapCovers(tracks) {
  let isArray = true;
  if (!Array.isArray(tracks)) {
    isArray = false;
    tracks = [tracks];
  }
  tracks = tracks.map(track => {
    if (!track.covers) return track;
    track.covers = track.covers.map(cover => {
      if (cover.type === 'local')
        return req.app.locals.static.covers + '/' + cover;
      return cover;
    });
    return track;
  });

  return isArray ? tracks : tracks[0];
}

export default router;
