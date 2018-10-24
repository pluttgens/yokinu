import db from '../database/index.mjs';
import express from 'express';
import Check from 'express-validator/check';
import Filter from 'express-validator/filter';
import HttpError from 'http-errors';

const router = express.Router();

const { param, query, body, checkSchema, validationResult } = Check;
const { matchedData } = Filter;

router
  .route('/')
  .get([],
    (req, res, next) => {
      (async () => {
        const playlists = await db.playlist.findAll({});

        return res.json({
          data: playlists
        });
      })().catch(next);
    })
  .post([
    body('name'),
    body('descriptopn')
  ], (req, res, next) => {
    (async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpError.BadRequest({ errors: errors.mapped() });
      }

      const { name, description } = matchedData(req);

      const playlist = await db.playlist.create({ name, description });

      return res.json({
        data: playlist
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

router
  .route('/:playlistId/tracks')
  .get([
      param('playlistId')
    ],
    (req, rest, next) => {

    })
  .put([
      param('playlistId'),
      body('trackId')
    ],
    (req, rest, next) => {

    });

router
  .route('/:playlistId/tracks/:trackId')
  .put([
      param('playlistId'),
      param('trackId')
    ],
    (req, res, next) => {
      (async () => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new HttpError.BadRequest({ errors: errors.mapped() });
        }

        const { playlistId, trackId } = matchedData(req);
        const playlist = await db.playlist.findById(playlistId);
        if (!playlist) {
          throw new HttpError(404, 'No playlist found.');
        }

        const track = await db.track.findById(trackId);
        if (!track) {
          throw new HttpError(404, 'No playlist found.');
        }

        await playlist.addTrack(track);
        return res.json({
          data: await track.reload({include: {model: db.playlist, as: 'playlists'}})
        })
      })().catch(next);
    });

export default router;
