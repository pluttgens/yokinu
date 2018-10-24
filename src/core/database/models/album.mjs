import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';
import sanitize from 'sanitize-filename';

export default function (sequelize) {
  const Album = sequelize.define('album', {
    id: {
      type: Sequelize.STRING(25),
      primaryKey: true
    },

    name: {
      type: Sequelize.STRING,
      allowNull: false
    },

    artistId: {
      type: Sequelize.STRING(25),
      field: 'artist_id'
    }
  }, {
    ...sqlGlobals.defaultOptions
  });

  Album.associate = function (models) {
    this.hasMany(models.track);

    this.belongsTo(models.artist, {
      foreignKey: 'artist_id',
      as: 'artist'
    });

    this.hasMany(models.cover, {
      as: 'covers'
    });
  };

  // Album.getUnkownAlbum = function (artistId) {
  //   return this.findOrCreate({
  //     where: {
  //       name: 'Unknown Album',
  //       artist_id: artistId
  //     }
  //   });
  // };

  Album.prototype.getSanitizedName = function () {
    return sanitize(this.name);
  };

  return Album;
}
