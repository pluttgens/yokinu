'use strict';

const Dropbox = require('dropbox');
const Promise = require('bluebird');
const config = require('../../config');
const db = require('../../core/index').db;
const https = require('https');
const mm = require('musicmetadata');

const dropbox = new Dropbox({
  accessToken: config.dropbox.token
});

module.exports.load = async () => {
  for (let i = 0; i < config.dropbox.directories.length; i++) {
    await loadDirectory(config.dropbox.directories[i]);
  }
};

async function loadDirectory (dir) {
  let result = (await dropbox.filesListFolder({
    path: dir,
    recursive: true,
    include_media_info: true
  }));

  await addToDb(result.entries);

  while (result.has_more) {
    result = await dropbox.filesListFolderContinue({
      cursor: result.cursor
    });

    await addToDb(result.entries);
  }
}

async function addToDb (entries) {
  const promises = [];
  for (let entry of entries) {
    if (entry['.tag'] !== 'file') continue;
    console.log(entry);
    const alreadyExists = await db.Track.findOneAsync({
      service: 'dropbox',
      path: entry.id
    });
    if (alreadyExists) {
      console.log('Already exists!');
      continue;
    }
    let download = await dropbox.filesGetTemporaryLink({
      path: entry.id
    });
    const stream = await _getStream(download.link);
    let metadata;
    try {
      metadata = await new Promise((resolve, reject) => {
        mm(stream, {duration: true, fileSize: download.metadata.size}, (err, metadata) => {
          if (err) return reject(err);
          resolve(metadata);
        });
      });
    } catch (err) {
      continue;
    }
    stream.destroy();
    let trackFromSameAlbum;
    if (metadata.artist.join(', ') && metadata.album && metadata.artist.join(',') !== 'Unknown' && metadata.album !== 'Unknown') {
      trackFromSameAlbum = await db.Track.findOneAsync({
        artist: metadata.artist.join(', '),
        album: metadata.album
      });
    }
    let picturePaths;
    if (trackFromSameAlbum && trackFromSameAlbum.covers) {
      picturePaths = trackFromSameAlbum.covers;
    } else {
      picturePaths = await Promise.all(metadata.picture.map(pic => db.Cover.save(pic.format, pic.data)));
    }
    promises.push(db.Track.insertAsync({
      title: metadata.title || 'Unknown',
      artist: metadata.artist.join(', ') || 'Unknown',
      album: metadata.album,
      duration: metadata.duration,
      track: metadata.track,
      disk: metadata.disk,
      genre: metadata.genre,
      covers: picturePaths,
      service: 'dropbox',
      path: entry.id
    }));
  }
  await Promise.all(promises);
}

module.exports.getStream = async function (id) {
  let download = await dropbox.filesGetTemporaryLink({
    path: id
  });
  return _getStream(download.link);
};

function _getStream (link) {
  return new Promise(resolve => {
    https.get(link, (response) => {
      resolve(response);
    });
  });
}
