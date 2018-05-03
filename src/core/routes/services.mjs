import express from 'express';
import serviceManager from '../services/ServiceManager.mjs';

const router = express.Router();

router
  .route('/:service/load')
  .post((req, res, next) => {
    const serviceName = req.params.service;
    const module = serviceManager.get(serviceName);

    (async () => {
      if (!module) {
        return res.status(404).json({
          error: 'No service found for : ' + serviceName + '.'
        });
      }

      await module
        .load()
        .catch(err => console.log(err));

      return res.json({
        message: `Loading service : ${serviceName}.`
      });
    })().catch(next);
  });

export default router;
