import express from 'express';
import db from '../database';
const router = express.Router();

router
  .route('/')
  .get((req, res, next) => {
    const service = req.query.service;

    const query = {
      playlists: {
        $exists: true,
        $ne: []
      }
    };

    if (service) {
      query.playlists.$elemMatch = {
        service: service
      };
    }

    (async () => {
      const playlists = await db.playlist.findAll({});

      const data = {};

      for (let playlist of playlists) {
        data[playlist.id] = {
          name: playlist.name,
          service: playlist.service_id,
          tracks: await playlist.getTracks({
            include: [
              { model: db.artist, as: 'artist'},
              { model: db.album, as: 'album' }
            ]
          })
        };
      }

      return res.json({
        data: data
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

module.exports = router;
