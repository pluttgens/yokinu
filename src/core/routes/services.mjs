import express from 'express';
import { serviceManager, serviceToService } from '../services/index';
import Check from 'express-validator/check';
import Filter from 'express-validator/filter';
import HttpError from 'http-errors';

const router = express.Router();

const { matchedData } = Filter;
const { param, query, body, validationResult } = Check;

router
  .route('/:serviceId/load')
  .post([
      body()
    ],
    (req, res, next) => {
      const serviceName = req.params.serviceId;
      const service = serviceManager.get(serviceName);

      (async () => {
        if (!service) {
          return res.status(404).json({
            error: 'No service found for : ' + serviceName + '.'
          });
        }

        await service
          .load()
          .catch(err => console.log(err));

        return res.json({
          message: `Loading service : ${serviceName}.`
        });
      })().catch(next);
    });

router
  .route('/:from/load/:to')
  .post([
    body('skip')
      .optional({ nullable: true })
      .isInt({ min: 0 }),
    body('limit')
      .optional({ nullable: true })
      .isInt({ min: 0, max: 1000 }),
    body('keepServiceTags')
      .optional({ nullable: true })
      .isBoolean(),
    body('addUnloadedTracks')
      .optional({ nullable: true })
      .isBoolean(),
    param('from')
      .isIn(serviceManager.list()),
    param('to')
      .isIn(serviceManager.list())
  ], (req, res, next) => {
    (async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpError.BadRequest({ errors: errors.mapped() });
      }

      const { from, to, skip = 0, limit = 1000, keepServiceTags = true, addUnloadedTracks } = matchedData(req);

      const job = await serviceToService.copy(from, to, {
        addUnloadedTracks,
        keepServiceTags,
        skip: Number(skip),
        limit: Number(limit)
      });

      return res.json({
        job: job.id,
        message: `Started copying from ${from} to ${to}`
      });
    })().catch(next);
  });

router
  .route('/:serviceId/unloaded_tracks')
  .get([
    query('skip')
      .optional({ nullable: true })
      .isInt({ min: 0 }),
    query('limit')
      .optional({ nullable: true })
      .isInt({ min: 0, max: 1000 }),
    param('serviceId')
      .isIn(serviceManager.list())
  ], (req, res, next) => {
    (async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpError.BadRequest({ errors: errors.mapped() });
      }
      const { serviceId, skip = 0, limit = 1000 } = matchedData(req);
      const service = serviceManager.get(serviceId);

      return res.json(await service.getUnloadedTracks({ withServiceTags: true, skip, limit }));
    })().catch(next);
  });


export default router;

