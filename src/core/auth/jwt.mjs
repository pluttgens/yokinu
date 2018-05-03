import config from 'config';
import HttpError from 'http-errors';
import jwt from 'jwt-simple';
import db from '../database/index.mjs';
import { operationalLogger } from '../loggers/index.mjs';

export default function () {
  return async (req, res, next) => {
    if (!config.yokinu.auth.jwt.enabled) {
      return next();
    }

    const token = req.token;
    if (!token) {
      return next(new HttpError.Unauthorized('No token found.'));
    }

    try {
      const payload = jwt.decode(token, config.yokinu.auth.jwt.secret);
      if (!payload) {
        return next(new HttpError.Unauthorized('Invalid token.'));
      }
      const user = await db.user.findById(payload.sub);
      if (!user) {
        return next(new HttpError.Unauthorized('Invalid token.'));
      }
      req.user = user;
      next();
    } catch (e) {
      operationalLogger.error(e);
      next(e);
    }
  }
};
