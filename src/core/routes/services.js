'use strict';

const express = require('express');
const router = express.Router();
const DelayedResponse = require('http-delayed-response');

router
  .route('/:service/load')
  .post((req, res, next) => {
    const serviceName = req.params.service;
    const module = req.app.locals.services[serviceName];
    const delayed = new DelayedResponse(req, res, next);
    delayed.wait();
    if (!module) return res.status(404).json({
      error: 'No service found for : ' + serviceName + '.'
    });
    (async () => {
      await module.load()
      delayed.end({
        message: 'service ' + serviceName + ' loaded!'
      });
    })().catch(next);
  });

module.exports = router;
