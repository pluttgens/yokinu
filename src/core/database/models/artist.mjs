import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';
import sanitize from 'sanitize-filename';

export default function (sequelize) {
  const Artist = sequelize.define('artist', {
    id: {
      type: Sequelize.STRING(25),
      primaryKey: true
    },

    name: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    getterMethods: {
      sanitizedName() {
        return sanitize(this.name);
      }
    },
    ...sqlGlobals.defaultOptions
  });

  Artist.associate = function (models) {
    this.hasMany(models.track);
    this.hasMany(models.album);
  };

  // Artist.getUnkownArtist = function () {
  //   return this.findOrCreate({
  //     where: {
  //       name: 'Unknown Artist'
  //     }
  //   });
  // };

  Artist.prototype.getSanitizedName = function () {
    return sanitize(this.name);
  };

  return Artist;
}
