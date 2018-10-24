import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';

export default function (sequelize) {
  const CopiedTrack = sequelize.define('copied_track', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    path: {
      type: Sequelize.STRING,
      required: true,
    }
  }, {
    ...sqlGlobals.defaultOptions,
  });

  CopiedTrack.associate = function (models) {
    this.belongsTo(models.track, { as: 'track' });
    this.belongsTo(models.service, { as: 'service' });
  };

  return CopiedTrack;
}
