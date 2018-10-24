import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';

export default function (sequelize) {
  const Playlist = sequelize.define('playlist', {
    id: {
      type: Sequelize.STRING(25),
      primaryKey: true
    },

    name: {
      type: Sequelize.STRING,
      allowNull: false,
      isAlphanumeric: true
    },
    description: {
      type: Sequelize.STRING
    }
  }, {
    ...sqlGlobals.defaultOptions
  });

  Playlist.associate = function (models) {
    this.belongsToMany(models.user, {
      through: 'user_playlists'
    });

    this.belongsToMany(models.track, {
      through: {
        model: 'playlist_track'
      },
      as: 'tracks',
      foreignKey: 'playlist_id'
    });
  };

  return Playlist;
}

