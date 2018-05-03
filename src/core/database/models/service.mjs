import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';

export default function (sequelize) {
  const Service = sequelize.define('service', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    }
  }, {
    ...sqlGlobals.defaultOptions

  });

  Service.associate = function (models) {
    this.hasMany(models.track, { as: 'tracks' });
    this.hasMany(models.playlist, { as: 'playlists' });
  };

  return Service;
}

