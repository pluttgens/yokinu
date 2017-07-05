import express from 'express';
const router = express.Router();

router
  .route('/:service/load')
  .post((req, res, next) => {
    const serviceName = req.params.service;
    const module = req.app.locals.services[serviceName];

    if (!module) {
      return res.status(404).json({
        error: 'No service found for : ' + serviceName + '.'
      });
    }

    module.load().catch(err => console.log(err));

    return res.json({
      message: 'service loaded.'
    });
  });

module.exports = router;
