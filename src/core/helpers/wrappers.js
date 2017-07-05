import HttpError from 'http-errors';
import {databaseLogger} from '../loggers';

export function dbCall (dbCall) {
  return dbCall
    .catch(e => {
      databaseLogger.error(e);
      throw HttpError();
    });
}
