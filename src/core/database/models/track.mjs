import config from 'config';
import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';
import Promise from 'bluebird';
import mm from 'music-metadata';
import albumArt from 'album-art';
import _ from 'lodash';
import path from 'path';
import sanitize from 'sanitize-filename';
import { elasticsearch } from '../elasticsearch.mjs';
import { operationalLogger } from '../../loggers/index.mjs';
import service from './service.mjs';
import { serviceManager } from '../../services';
import {File} from '../../helpers';

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
    format: {
      type: Sequelize.STRING
    },
    path: {
      type: Sequelize.STRING
    },
    serviceId: {
      type: Sequelize.STRING,
      field: 'service_id'
    }
  }, {
    ...sqlGlobals.defaultOptions,
    indexes: [
      { fields: ['path', 'service_id'], unique: true },
      { fields: ['artist_id', 'album_id', 'title', 'format', 'service_id'], unique: true }
    ],
    hooks: {}
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
      foreignKey: 'track_id'
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

  Track.fromTags = async function ({ extension, tags = {}, userTags = {}, size, transaction }) {
    operationalLogger.debug(`$Track.fromTags.`);
    const { models } = sequelize;

    operationalLogger.info(`Track tags : ${JSON.stringify(tags)}`);
    operationalLogger.info(`User tags : ${JSON.stringify(userTags)}`);
    try {
      const [artist, artistCreated] = await models.artist.findOrCreate({
        where: {
          name: tags.common.artist || userTags.artist
        },
        transaction
      });

      if (artistCreated)
        operationalLogger.debug(`New artist : ${artist.name}`);

      const [album, albumCreated] = await models.album.findOrCreate({
        where: {
          name: tags.common.album || userTags.album,
          artistId: artist.id
        },
        transaction
      });

      if (albumCreated)
        operationalLogger.debug(`New album : ${album.name}`);


      // Genres
      let foundOrCreatedGenres;
      let genres = [];

      if (userTags.genre) {
        foundOrCreatedGenres = await processGenres([userTags.genre])
      } else if (tags.common.genre) {
        foundOrCreatedGenres = await processGenres(tags.common.genre)
      }

      if (foundOrCreatedGenres) {
        foundOrCreatedGenres = await Promise.all(foundOrCreatedGenres.map(genre => {
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

      const track = await this.create({
        title: userTags.title || tags.common.title,
        duration: userTags.duration || tags.format.duration,
        trackNumber: userTags.trackNumber || tags.common.track.no,
        trackNumberOf: userTags.trackNumberOf || tags.common.track.of,
        discNumber: userTags.discNumber || tags.common.disk.no,
        discNumberOf: userTags.discNumberOf || tags.common.disk.of,
        size: userTags.size || size,
        bitrate: userTags.bitrate || tags.format.bitrate,
        sampleRate: userTags.sampleRate || tags.format.sampleRate,
        channels: userTags.channels || tags.format.numberOfChannels,
        format: extension
      }, {
        transaction
      });
      operationalLogger.debug(`Created track : ${JSON.stringify(track.get({ plain: true }))}`);

      await track.setArtist(artist, { transaction });
      await track.setAlbum(album, { transaction });
      await track.setGenres(genres, { transaction });

      return track
    } catch (err) {
      operationalLogger.error(err);
      throw err;
    }
  };

  function processGenres(genres) {
    return genres
      .filter(genre => genre)
      .map(genre => genre.split(','))
      .reduce((prev, curr) => prev.concat(curr), [])
      .map(genre => genre.trim());
  }

  Track.fromFile = async function (file, { userTags = {}, transaction, requestId } = {}) {
    operationalLogger.debug(`${requestId} - Track.fromStream.`);

    let tags = {};
    try {
      tags = await mm.parseFile(file.path, {
        mime: file.mime,
        duration: true,
        fileSize: file.size
      });
    } catch (err) {
      operationalLogger.error(`${requestId} - music-metadata error : ${err}`);
      throw err;
    }

    return this.fromTags({
      tags,
      userTags,
      size: file.size,
      extension: file.getExt(),
      transaction
    });
  };

  Track.getAlbumArt = async function (artist, album) {
    const artUrl = await albumArt(artist, { album });
    operationalLogger.debug(`Fetched album art : ${artUrl}`);
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

  Track.prototype.indexInElastic = async function ({ transaction }) {
    operationalLogger.info(`Indexing ${this} in elasticsearch`);
    const artist = await this.getArtist({ transaction });
    const album = await this.getAlbum({ transaction });
    const genres = await this.getGenres({ transaction });

    return elasticsearch.index({
      index: config.yokinu.elasticsearch.index,
      type: 'tracks',
      id: this.id,
      body: {
        title: this.title,
        artist: artist.name,
        album: album.name,
        genre: genres.map(genre => genre.name),
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

  Track.textSearch = async function (q = '', skip = 0, limit = 100) {
    const { models } = sequelize;

    let result = { count: 0, rows: [] };

    const include = [
      { model: models.artist, as: 'artist', attributes: ['id', 'name'] },
      { model: models.album, as: 'album', attributes: ['id', 'name', 'artist_id'] },
      { model: models.genre, as: 'genres', attributes: ['id', 'name'] }
    ];

    if (!q) {
      result = await this.findAndCountAll({
        offset: skip,
        limit,
        include
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
          offset: skip,
          limit,
          include
        });
      }
    }
    return {
      total: result.count,
      tracks: result.rows
    };
  };

  Track.prototype.getFsPath = async function ({ includeArtist = true, includeAlbum = true, includeTitle = true, includeFormat = true, discriminant, join, transaction }) {
    let fsPath = ``;
    if (includeArtist) {
      const artist = await this.getArtist({ transaction });
      fsPath = concatPath(join, fsPath, artist.getSanitizedName());
    }

    if (includeAlbum) {
      const album = await this.getAlbum({ transaction });
      fsPath = concatPath(join, fsPath, album.getSanitizedName());
    }

    if (includeTitle) {
      fsPath = concatPath(join, fsPath, this.getSanitizedTitle());
    }

    if (discriminant) {
      fsPath = `${fsPath}_${discriminant}`;
    }

    if (includeFormat) {
      fsPath = `${fsPath}.${this.format}`;
    }

    return fsPath;
  };

  Track.prototype.getSanitizedTitle = function () {
    return sanitize(this.title);
  };

  function concatPath(join, ...concat) {
    if (join) {
      return path.join(...concat);
    }

    return concat.join('/');
  }

  Track.prototype.toString = function () {
    return `[${this.id}] ${this.title}`;
  };

  Track.prototype.getLocalTemporaryFile = async function() {
    const service = serviceManager.get(this.serviceId);
    operationalLogger.info(`Downloading temporary file for ${this} from ${service.name}`);
    if (service.isLocal()) {
      operationalLogger.debug(`Service is local.`);
      return {
        path: this.path,
        async cleanup() {}
      };
    }

    const stream = await service.getStream(this);
    return File.streamToTemporaryFile(stream);
  };


  Track.SUPPORTED_FORMATS = {
    MP3: 'mp3',
    FLAC: 'flac',
    M4A: 'm4a'
  };

  return Track;
};

