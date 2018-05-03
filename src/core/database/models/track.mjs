import config from 'config';
import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';
import Promise from 'bluebird';
import mm from 'music-metadata';
import mime from 'mime-types';
import albumArt from 'album-art';
import * as helpers from '../../helpers/index';
import _ from 'lodash';
import { elasticsearch } from '../elasticsearch.mjs';
import { operationalLogger } from '../../loggers/index.mjs';

const Op = Sequelize.Op;

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
      type: Sequelize.DECIMAL(10, 2)
    },
    trackNumber: {
      type: Sequelize.INTEGER
    },
    trackNumberOf: {
      type: Sequelize.INTEGER
    },
    discNumber: {
      type: Sequelize.INTEGER
    },
    discNumberOf: {
      type: Sequelize.INTEGER
    },
    size: {
      type: Sequelize.INTEGER
    },
    bitrate: {
      type: Sequelize.INTEGER
    },
    sampleRate: {
      type: Sequelize.INTEGER
    },
    channels: {
      type: Sequelize.INTEGER
    },
    path: {
      type: Sequelize.STRING,
      unique: 'track__path_service'
    },
    serviceId: {
      type: Sequelize.STRING,
      unique: 'track__path_service',
      field: 'service_id'
    }
  }, {
    ...sqlGlobals.defaultOptions,
  });

  Track.associate = function (models) {
    this.belongsToMany(models.user, {
      through: 'user_track'
    });

    this.belongsToMany(models.playlist, {
      through: {
        model: 'playlist_track'
      },
      as: 'playlists',
      foreignKey: 'trackId'
    });

    this.belongsToMany(models.genre, {
      through: {
        model: 'genre_track'
      },
      as: 'genres',
      foreignKey: 'trackId'
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

  Track.fromFile = async function (serviceId, path, type, size, transaction) {
    const { models } = sequelize;
    try {
      const tags = await models.track.readTags(path, type, size);

      console.log(tags);

      // if (tags.common.picture)

      const [artist, artistCreated] = await models.artist.findOrCreate({
        where: {
          name: tags.common.artist
        },
        transaction
      });

      if (artistCreated)
        operationalLogger.debug(`New artist : ${artist.name}`);

      const [album, albumCreated] = await models.album.findOrCreate({
        where: {
          name: tags.common.album,
          artistId: artist.id
        },
        transaction
      });

      if (albumCreated)
        operationalLogger.debug(`New album : ${album.name}`);


      let foundOrCreatedGenres;
      let genres = [];
      if (tags.common.genre) {
        foundOrCreatedGenres = await Promise.all(
          tags.common.genre
            .map(genre => genre.split(','))
            .reduce((prev, curr) => prev.concat(curr), [])
            .map(genre => genre.trim())
            .map(genre => {
              return models.genre.findOrCreate({
                where: {
                  name: genre
                },
                transaction
              });
            }));

        foundOrCreatedGenres = foundOrCreatedGenres.map(foundOrCreatedGenre => ({
          genre: foundOrCreatedGenre[0],
          created: foundOrCreatedGenre[1]
        }));

        genres = foundOrCreatedGenres.map(foundOrCreatedGenre => foundOrCreatedGenre.genre);

        foundOrCreatedGenres
          .filter(foundOrCreatedGenre => foundOrCreatedGenre.created)
          .forEach(foundOrCreatedGenre => operationalLogger.debug(`New genre : ${foundOrCreatedGenre.genre.name}`));
      }

      const track = await models.track.create({
        title: tags.common.title,
        duration: tags.format.duration,
        trackNumber: tags.common.track.no,
        trackNumberOf: tags.common.track.of,
        discNumber: tags.common.disk.no,
        discNumberOf: tags.common.disk.of,
        size: size,
        bitrate: tags.format.bitrate,
        sampleRate: tags.format.sampleRate,
        channels: tags.format.numberOfChannels,
        path: path,
        serviceId: serviceId
      }, {
        transaction
      });

      await track.setArtist(artist, { transaction, save: false });
      await track.setAlbum(album, { transaction, save: false });
      await track.setGenres(genres, { transaction, save: false });

      operationalLogger.debug(`Built track : ${JSON.stringify(track.get({ raw: true }))}`);

      return track;
    } catch (err) {
      operationalLogger.error(err);
      throw err;
    }
  };

  Track.getAlbumArt = async function (artist, album) {
    const artUrl = await albumArt(artist, { album });
    operationalLogger.debug(`Fetched album art : ${artUrl}`)
    return artUrl;
  };

  Track.indexInElasticsearch = async function () {
    const { models } = sequelize;
    const tracks = await this.findAll({
      attributes: ['id', 'title', 'path'],
      include: [
        { model: models.artist, as: 'artist' },
        { model: models.album, as: 'album' },
        { model: models.genre, as: 'genres' },
        { model: models.service, as: 'service' },
      ]
    });
    operationalLogger.debug(`Tracks to index in ES : ${tracks.map(track => track.id)}`);

    return Promise
      .resolve(_.chunk(tracks, 1000))
      .each(chunk => {
        return elasticsearch.bulk({
          body: chunk
            .reduce((prev, curr) => {
              prev.push({
                index: {
                  _index: config.yokinu.elasticsearch.index,
                  _type: 'tracks',
                  _id: curr.id
                }
              });

              prev.push({
                title: curr.title,
                artist: curr.artist.name,
                album: curr.album.name,
                genre: curr.genres.map(genre => genre.name).join(', '),
                path: curr.path,
                service: curr.service.id
              });
              return prev;
            }, [])
        });
      });
  };

  Track.prototype.indexInElastic = async function () {
    const artist = await this.getArtist();
    const album = await this.getAlbum();
    const genres = await this.getGenres();

    operationalLogger.debug(this.serviceId);

    return elasticsearch.index({
      index: config.yokinu.elasticsearch.index,
      type: 'tracks',
      id: this.id,
      body: {
        title: this.title,
        artist: artist.name,
        album: album.name,
        genre: genres.map(genre => genre.name).join(', '),
        path: this.path,
        service: this.serviceId
      }
    })
  };

  async function queryElasticsearch(q) {
    const esResults = await elasticsearch
      .search({
        index: config.yokinu.elasticsearch.index,
        type: 'tracks',
        body: {
          query: {
            multi_match: {
              type: 'phrase_prefix',
              fields: ['title^5', 'artist^4', 'album^3', 'genre^2', 'path', 'service'],
              query: q
            }
          }
        },
        size: 1000
      });

    return esResults;
  }

  Track.textSearch = async function (q = '', skip = '0', limit = '100') {
    const { models } = sequelize;
    const options = helpers.params.checkSkipLimit(skip, limit);

    let result = { count: 0, rows: [] };

    if (!q) {
      result = await this.findAndCountAll({
        offset: options.skip,
        limit: options.limit,
        include: [
          { model: models.artist, as: 'artist' },
          { model: models.album, as: 'album' },
          { model: models.genre, as: 'genres' },
          { model: models.service, as: 'service' },
        ]
      });
    } else {
      const esResults = await queryElasticsearch(q);
      if (esResults.hits.total !== 0) {
        const trackIds = esResults.hits.hits.map(hit => hit._id);
        result = await this.findAndCountAll({
          where: {
            id: {
              [Op.in]: trackIds
            }
          },
          offset: options.skip,
          limit: options.limit,
          include: [
            { model: models.artist, as: 'artist' },
            { model: models.album, as: 'album' },
            { model: models.genre, as: 'genres' },
            { model: models.service, as: 'service' },
          ]
        });
      }
    }
    return {
      total: result.count,
      tracks: result.rows
    };
  };

  Track.readTags = function (filePath, mimeType, fileSize) {
    if (!mimeType) {
      mimeType = mime.lookup(filePath);
    }

    return mm.parseFile(filePath, mimeType, {
      duration: true,
      fileSize
    });
  };

  Track.prototype.toString = function () {
    return `[${this.id}] ${this.title}`;
  };

  return Track;
}
