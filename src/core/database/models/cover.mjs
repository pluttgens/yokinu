import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';

export default function (sequelize) {
  const Cover = sequelize.define('cover', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },

    path: {
      type: Sequelize.STRING,
      unique: true,
      required: true
    }
  }, {
    ...sqlGlobals.defaultOptions
  });

  Cover.associate = function (models) {
  };
};
