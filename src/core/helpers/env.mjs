import config from 'config';

export const ENVS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production'
};

export function isDevelopment () {
  return process.env.NODE_ENV === ENVS.DEVELOPMENT;
}

export function shouldForceSync () {
  return isDevelopment() && config.force_sync;
}
