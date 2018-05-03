import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';

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

  return Artist;
}
