import config from 'config';
import dropbox from './dropbox/index';
import gmusic from './gmusic/index';
import local from './local/index';
import s3 from './s3/index';
import Promise from 'bluebird';
import {operationalLogger} from '../loggers/index.mjs';

class ServiceManager {
  constructor() {
    this._services = {
      dropbox,
      gmusic,
      local,
      s3
    };
    this.services = {};
    const servicesConf = config.services;
    Object.keys(servicesConf)
      .filter(service => servicesConf[service].active)
      .forEach(service => this.load(service, servicesConf[service]));
  }


  load(serviceName, config) {
    operationalLogger.info(`Adding service : ${serviceName}.`);
    this.services[serviceName] = new (this._services[serviceName])(config);

  }

  get(service) {
    return this.services[service];
  }

  list() {
    return Object.keys(this.services);
  }

  async init() {
    operationalLogger.info(`Initializing services...`);
    await Promise.each(
      Object.keys(this.services),
      serviceName => this.services[serviceName].init()
    );
    operationalLogger.info(`Services initialized.`);
  }
}


const serviceManager = new ServiceManager();

export default serviceManager;
