import HttpError from 'http-errors';
import {databaseLogger} from '../loggers';

export function dbCall (dbCall) {
  return dbCall
    .catch(e => {
      databaseLogger.error(e);
      throw HttpError();
    });
}

// export function jsonRes (res, status, message: {}, metas: {}) {
//   if (status
//   return res.status(status).json(Object.assign({}, metas, message));
// }
