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
    this.hasMany(models.track);
    this.hasMany(models.playlist);
  };

  return Service;
}

