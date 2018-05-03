import ExtendableError from 'es6-error';

export default class InitializationError extends ExtendableError {
  constructor (message = 'Could not initialize service.') {
    super(message);
  }
}
