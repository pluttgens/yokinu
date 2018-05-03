import express from 'express';
import HttpError from 'http-errors';
import Check from 'express-validator/check';
import Filter from 'express-validator/filter';
import db from '../database/index.mjs';

const router = express.Router();

const { checkSchema, validationResult } = Check;
const { matchedData } = Filter;

router
  .route('/')
  .post(checkSchema(db.user.getValidationSchema({
    username: {
      custom: {
        options: async (username, { req, location, path }) => {
          const user = await db.user.findOne({
            where: {
              username
            }
          });
          if (user) throw new Error('This username is already taken.');
        }
      }
    }
  })), (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError.BadRequest({ errors: errors.mapped() }));
    }

    let user = matchedData(req);

    (async () => {
      user = await db.user.create(user);
      return res.status(201).json({ user })
    })().catch(next)
  });

export default router;
