import Sequelize from 'sequelize';
import db from '../database/index.mjs'
import {operationalLogger} from '../loggers/index.mjs';

const Op = Sequelize.Op;

export default class BaseService {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  init() {
    operationalLogger.info(`Initializing service : ${this.name}.`);
    return db.service.findOrCreate({
      where: {
        id: this.name
      }
    });
  }

  registerRoutes(router) {

  }

  async load(params) {
    operationalLogger.info(`Loading service : ${this.name}`);
  }

  getStream(path) {

  }

  putTrack(req, body) {

  }

  getBatchSize() {
    return this.config.low_memory ? 500 : 3000;
  }
}
