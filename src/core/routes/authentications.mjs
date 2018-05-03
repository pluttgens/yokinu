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
  .post(checkSchema(db.user.getValidationSchema()), (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError.BadRequest({ errors: errors.mapped() }));
    }

    const loggingIn = matchedData(req);

    (async () => {
      const user = await db.user.findOne({
        where: {
          username: loggingIn.username
        }
      });

      if (!user) {
        throw new HttpError.Unauthorized('Username/Password do not match.');
      }

      const match = await user.comparePassword(loggingIn.password);
      if (!match) {
        throw new HttpError.Unauthorized('Username/Password do not match.');
      }

      const token = await user.newJwtToken();
      return res.status(200).json({ token });
    })().catch(next)
  });

export default router;
