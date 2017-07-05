'use strict';

var express = require('express');
var router = express.Router();
var DelayedResponse = require('http-delayed-response');

router.route('/:service/load').post(function (req, res, next) {
  var serviceName = req.params.service;
  var module = req.app.locals.services[serviceName];
  var delayed = new DelayedResponse(req, res, next);
  delayed.wait();
  if (!module) {
    return res.status(404).json({
      error: 'No service found for : ' + serviceName + '.'
    });
  }

  module.load().then(function () {
    delayed.end({
      message: 'service ' + serviceName + ' loaded!'
    });
  }).catch(function (err) {
    console.log(err);
    next(err);
  });
});

module.exports = router;
// # sourceMappingURL=services.js.map
