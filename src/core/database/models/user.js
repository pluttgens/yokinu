import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';

export default function (sequelize) {
  const User = sequelize.define('user', {
    id: {
      type: Sequelize.STRING(25),
      primaryKey: true
    },

    username: {
      type: Sequelize.STRING(25),
      unique: true,
      allowNull: false,
      isAlphanumeric: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    indexes: [
      // {name: 'unique_username', unique: true, fields: ['username', Sequelize.fn('lower', sequelize.col('username'))]}
    ],
    ...sqlGlobals.defaultOptions
  });

  User.associate = function (models) {
    this.belongsToMany(models.track, {
      through: 'user_tracks'
    });

    this.belongsToMany(models.playlist, {
      through: 'user_playlist',
      scope: 'owner'
    });
  };

  return User;
}

