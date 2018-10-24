import ExtendableError from 'es6-error';

export default class InvalidTrackInputError extends ExtendableError {
  constructor (message = 'Track input must be either an instance of string or node stream.') {
    super(message);
  }
}
