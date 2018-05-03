import config from 'config';
import Sequelize from 'sequelize';
import { env, snowflake } from '../helpers/index.mjs';
import * as Elasticsearch from './elasticsearch';
import * as models from './models/index.mjs';
import { databaseLogger } from '../loggers/index.mjs';
import { EXIT_CODES } from '../errors/index.mjs';

const sequelize = new Sequelize(config.yokinu.mariadb.uri, {
  logging: msg => databaseLogger.debug(msg),
  define: {
    freezeTableName: true
  },
  typeValidation: true,
  pool: {
    max: config.yokinu.mariadb.pool.max,
    min: 0,
    idle: 10000
  }
});

Object.keys(models).forEach(model => models[model](sequelize));

sequelize.addHook('beforeCreate', async function (instance, options) {
  if (instance.id) return Promise.resolve();
  instance.id = await snowflake.getId();
});

sequelize.addHook('validationFailed', function (instance, options, error) {
  databaseLogger.error(error);
});

Object.keys(sequelize.models).forEach(name => {
  if ('associate' in sequelize.models[name]) {
    sequelize.models[name].associate(sequelize.models);
  }
});

async function init() {
  const shouldForceSync = env.shouldForceSync();
  databaseLogger.debug(`syncing database - force : ${shouldForceSync}`);
  try {
    await Elasticsearch.init();
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync({ force: shouldForceSync, alter: shouldForceSync });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (e) {
    databaseLogger.error(e);
    process.exit(EXIT_CODES.DATABASE_ERROR);
  }
}

export default {
  init,
  sequelize,
  ...sequelize.models
};
