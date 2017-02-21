'use strict';

const express = require('express');
const router = express.Router();

router
  .post('/register', (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    (async => {

    })().catch(next);
  });