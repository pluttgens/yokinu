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
      unique: 'playlist__name_service',
      allowNull: false,
      isAlphanumeric: true
    },
    description: {
      type: Sequelize.STRING
    },
    remote_id: {
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
        model: 'playlist_tracks',
        unique: true
      },
      as: 'tracks',
      foreignkey: 'playlist_id'
    });

    this.belongsTo(models.service, {
      foreignKey: 'service_id',
      unique: 'playlist__name_service',
      as: 'service'
    });
  };

  return Playlist;
}

