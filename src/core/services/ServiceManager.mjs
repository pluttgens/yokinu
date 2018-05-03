import config from 'config';
// import dropbox from './dropbox/index.mjs';
import gmusic from './gmusic/index.mjs';
import local from './local/index.mjs';
import Promise from 'bluebird';
import {operationalLogger} from '../loggers/index.mjs';

class ServiceManager {
  constructor() {
    this._services = {
      // dropbox,
      gmusic,
      local
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

  async init() {
    operationalLogger.info(`Initializing services...`);
    await Promise.all(
      Object.keys(this.services)
        .map(serviceName => this.services[serviceName].init())
    );
    operationalLogger.info(`Services initialized.`);
  }
}


const serviceManager = new ServiceManager();

export default serviceManager;
