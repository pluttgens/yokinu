import express from 'express';
import db from '../database/index.mjs';
import Check from 'express-validator/check';
import Filter from 'express-validator/filter';
import HttpError from 'http-errors';

const router = express.Router();

const { matchedData } = Filter;
const { body, param, validationResult } = Check;

router
  .route('/:jobId')
  .get([
    param('jobId')
      .exists(),
  ], (req, res, next) => {
    (async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpError.BadRequest({ errors: errors.mapped() });
      }

      const { jobId } = matchedData(req);

      const job = await db.job.searchById(jobId);
      if (!job) throw HttpError.NotFound('Job not found.');

      return res.json(job);
    })().catch(next);
  });


router
  .route('/copies')
  .post([
    body('kind')
      .isIn(db.job.getKinds()),
    body('args')
      .exists()
  ], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpError.BadRequest({ errors: errors.mapped() });
    }

    const { kind, args } = matchedData(req);

    switch (kind) {
      case db.job.KINDS.COPY:

    }
  });

export default router;

