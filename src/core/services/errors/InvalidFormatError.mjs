import ExtendableError from 'es6-error';

export default class InvalidFormatError extends ExtendableError {
  constructor (message = 'File format is not supported.') {
    super(message);
  }
}
