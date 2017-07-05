import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';

export default function (sequelize) {
  const Track = sequelize.define('track', {
    id: {
      type: Sequelize.STRING(25),
      primaryKey: true
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    duration: {
      type: Sequelize.INTEGER
    },
    track_number: {
      type: Sequelize.INTEGER
    },
    track_number_of: {
      type: Sequelize.INTEGER
    },
    disc_number: {
      type: Sequelize.INTEGER
    },
    disc_number_of: {
      type: Sequelize.INTEGER
    },
    size: {
      type: Sequelize.INTEGER
    },
    genre: {
      type: Sequelize.STRING
    },
    path: {
      type: Sequelize.STRING,
      unique: 'track__path_service'
    },
    service_id: {
      type: Sequelize.STRING,
      unique: 'track__path_service'
    }
  }, {
    ...sqlGlobals.defaultOptions
  });

  Track.associate = function (models) {
    this.belongsToMany(models.user, {
      through: 'user_tracks'
    });

    this.belongsToMany(models.playlist, {
      through: {
        model: 'playlist_tracks',
        unique: true
      },
      scope: 'playlistTracks',
      as: 'playlists',
      foreignkey: 'track_id'
    });

    this.belongsTo(models.service, {
      as: 'service',
      foreignKey: 'service_id'
    });
    this.belongsTo(models.album, {
      as: 'album',
      foreignKey: 'album_id'
    });
    this.belongsTo(models.artist, {
      as: 'artist',
      foreignKey: 'artist_id'
    });
  };

  return Track;
}
