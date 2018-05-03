import config from 'config';
import validator from 'validator';
import HttpError from 'http-errors';

export function checkSkipLimit (skip, limit) {
  if (skip && !validator.isInt(skip)) { throw HttpError(400, 'skip must be an integer.'); }

  if (limit && !validator.isInt(limit)) { throw HttpError(400, 'limit must be an integer.'); }

  skip = Number(skip) || 0;
  limit = Math.min(Number(limit), config.yokinu.low_memory ? 100 : 1000);
  return {
    skip,
    limit
  };
}

export function removePassword (obj) {
  delete obj['password'];
  return obj;
}
