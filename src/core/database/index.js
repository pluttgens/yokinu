import config from 'config';
import Sequelize from 'sequelize';
import { env, snowflake } from '../helpers';
import * as Elasticsearch from './elasticsearch';
import * as models from './models';
import { databaseLogger } from '../loggers';
import { exitCodes } from '../errors';

const sequelize = new Sequelize(config.yokinu.mariadb.uri, {
  logging: false,
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

sequelize.addHook('validationFailed', function (instance, options, error, fn) {
  databaseLogger.error(error);
  fn();
});

Object.keys(sequelize.models).forEach(name => {
  if ('associate' in sequelize.models[name]) {
    sequelize.models[name].associate(sequelize.models);
  }
});

async function init() {
  databaseLogger.debug(`syncing database - force : ${env.shouldForceSync()}`);
  try {
    if (env.isDevelopment()) {
      await Elasticsearch.init();
    }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync({ force: env.shouldForceSync() });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (e) {
    databaseLogger.error(e);
    process.exit(exitCodes.NO_DATABASE);
  }
}

export default {
  init,
  elasticsearch: Elasticsearch.elasticsearch,
  sequelize,
  ...sequelize.models
};
