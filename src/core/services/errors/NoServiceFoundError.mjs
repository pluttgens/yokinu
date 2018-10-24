import ExtendableError from 'es6-error';

export default class NoServiceFoundError extends ExtendableError {
  constructor (serviceId, message = 'No service found.') {
    if (serviceId)
      message = `No service found for this service ID : ${serviceId}`;
    super(message);
  }
}
