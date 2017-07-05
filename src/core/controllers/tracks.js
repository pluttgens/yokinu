import HttpError from 'http-errors';
import config from 'config';
import { operationalLogger } from '../loggers';
import db from '../database';
import * as helpers from '../helpers';
import _ from 'lodash';
import Promise from 'bluebird';

export function indexInElasticsearch(tracks) {
  return Promise
    .resolve(_.chunk(tracks, 1000))
    .each(chunk => {
      return db.elasticsearch.bulk({
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
              artist: curr.artist,
              album: curr.album,
              genre: curr.genre,
              path: curr.path,
              service: curr.service
            });
            return prev;
          }, [])
      });
    });
}

export async function getTrack(id) {
  operationalLogger.info('GET TRACK : ' + id);
  const track = await helpers.wrappers.dbCall(db.track.findById(id));
  if (!track) {
    throw new HttpError(404, 'No track found.');
  }
  return track;
}

async function queryElasticsearch(q) {
  const esResults = await db.elasticsearch
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
      }
    });

  return esResults;
}

export async function findTracks(q = '', skip = '0', limit = '100') {
  const options = helpers.params.checkSkipLimit(skip, limit);

  if (!q) {
    return {
      total: await db.track.count(),
      tracks: await helpers.wrappers.dbCall(db.track.findAll({
        offset: options.skip,
        limit: options.limit,
        include: [
          { model: db.artist, as: 'artist'},
          { model: db.album, as: 'album' }
        ]
      }))
    };
  }

  const esResults = await queryElasticsearch(q);
  if (esResults.hits.total === 0) {
    return {
      total: 0,
      tracks: []
    };
  }

  const trackIds = esResults.hits.hits.map(hit => hit._id);
  return {
    total: await db.track.count(),
    tracks: await helpers.wrappers.dbCall(db.track
      .findAll({
        where: {
          id: {
            $in: trackIds
          }
        },
        offset: options.skip,
        limit: options.limit,
        include: [
          { model: db.artist, as: 'artist'},
          { model: db.album, as: 'album' }
        ]
      }))
  };
}
