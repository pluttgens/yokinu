import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';

export default function (sequelize) {
  const Genre = sequelize.define('genre', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },

    name: {
      type: Sequelize.STRING,
      unique: true
    }
  }, {
    ...sqlGlobals.defaultOptions
  });

  Genre.associate = function (models) {
    this.belongsToMany(models.track, {
      through: {
        model: 'genre_track'
      },
      as: 'tracks',
      foreignKey: 'genre_id'
    });
  };

  return Genre;
}

