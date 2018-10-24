import _ from 'lodash';

export default class Queue {
  constructor() {
    this.data = [];
  }

  next() {
    return this.data.shift();
  }

  push(data, { shuffle } = {}) {
    if (!Array.isArray(data)) {
      return this.data.push(data);
    }

    if (shuffle) {
      data = _.shuffle(data);
    }
    data.forEach(e => this.data.push(e));
  }

  shuffle() {
    this.data = _.shuffle(this.data);
  }
};
