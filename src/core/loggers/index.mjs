import logger from 'log4js';

const LOGGERS = {
  ACCESS: 'access',
  DATABASE: 'database',
  DEFAULT: 'default',
  ELASTIC: 'elastic',
  OPERATIONAL: 'operational',
  REDIS: 'redis',
};


logger.configure({
  appenders: {
    console: {
      type: 'console',
      layout: {
        type: 'colored'
      }
    },
  },
  categories: {
    [LOGGERS.ACCESS]: {
      appenders: ['console'],
      level: 'ALL'
    },
    [LOGGERS.DATABASE]: {
      appenders: ['console'],
      level: 'ALL'
    },
    [LOGGERS.DEFAULT]: {
      appenders: ['console'],
      level: 'OFF'
    },
    [LOGGERS.ELASTIC]: {
      appenders: ['console'],
      level: 'ALL'
    },
    [LOGGERS.OPERATIONAL]: {
      appenders: ['console'],
      level: 'ALL'
    },
    [LOGGERS.REDIS]: {
      appenders: ['console'],
      level: 'ALL'
    }
  }
});

export const accessLogger = logger.getLogger(LOGGERS.ACCESS);
export const databaseLogger = logger.getLogger(LOGGERS.DATABASE);
export const elasticLogger = logger.getLogger(LOGGERS.ELASTIC);
export const operationalLogger = logger.getLogger(LOGGERS.OPERATIONAL);
export const redisLogger = logger.getLogger(LOGGERS.REDIS);
