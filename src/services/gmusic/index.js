import PlayMusic from 'playmusic';
import Promise from 'bluebird';
import _ from 'lodash';
import BaseService from '../BaseService';
import Errors from '../errors';


const pm = new PlayMusic();
Promise.promisifyAll(pm);

export default class GmusicService extends BaseService {
  constructor(config, params) {
    super('gmusic', {
      config,
      database: params.database,
      controllers: params.controllers,
      snowflake: params.snowflake
    })
  }

  async init() {
    await super.init();
    return pm
      .initAsync({
        androidId: this.config.androidId,
        masterToken: this.config.masterToken
      })
      .catch(e => Promise.reject(new Errors.InitializationError(e)));
  }

  async load(params) {
    const startedAt = Date.now();
    // temporary constant to avoid fetching too much data.
    const LIMIT = -1;
    const SLICE = 0;

    console.log(Date.now() - startedAt, 'ms.', 'Fetching tracks...');
    let tracks = await fetchTracks(null, 0);
    if (SLICE) tracks = tracks.slice(0, SLICE);

    console.log(Date.now() - startedAt, 'ms.', 'Fetching playlists...');
    let playlists = (await fetchPlayLists()).reduce((prev, curr) => {
      prev[curr.id] = curr;
      return prev;
    }, {});

    console.log(Date.now() - startedAt, 'ms.', 'Fetching playlist entries...');
    let playlistTracks = await fetchPlayListEntries(null, 0);


    console.log(Date.now() - startedAt, 'ms.', 'Fetching favorites...');
    const favorites = await pm.getFavoritesAsync();
    //console.log(favorites.track[0]);

    console.log(Date.now() - startedAt, 'ms.', 'Creating playlists...');
    try {
      playlists = await this.database.playlist.bulkCreate(Object
        .keys(playlists)
        .map(playlistId => ({
          name: playlists[playlistId].name,
          description: playlists[playlistId].description,
          remote_id: playlists[playlistId].id,
          service_id: this.name
        })), {
        individualHooks: true,
        updateOnDuplicate: true
      });
    } catch (e) {
      playlists = await this.database.playlist.findAll({
        where: {
          service_id: this.name
        }
      });
    }
    console.log(Date.now() - startedAt, 'ms.', 'Done creating playlists.');

    console.log(Date.now() - startedAt, 'ms.', 'Preparing data structures.');

    playlistTracks = playlistTracks
      .reduce((prev, curr) => {
        const trackId = curr.trackId || curr.storeId;
        let playlist = playlists.find(playlist => playlist.getDataValue('remote_id') === curr.playlistId);
        if (!playlist) return prev;
        if (!prev[trackId]) prev[trackId] = [playlist.id];
        else prev[trackId].push(playlist.id);
        return prev;
      }, {});

    let artists = {};
    let albums = {};
    let _tracks = [];
    let _playlistTracks = [];
    let elasticTracks = [];
    for (let track of tracks) {
      const trackId = track.id || track.storeId;
      const artistName = track.artist || track.albumArtist || 'Unknown Artist';
      let artist;
      if (!(artist = artists[artistName.trim().toLowerCase()])) {
        artist = {
          id: await this.snowflake.getId(),
          name: artistName
        };
        artists[artistName.trim().toLowerCase()] = artist;
      }

      const albumKey = track.album ? track.album.trim().toLowerCase() : 'Unknown Album' + artist.id;
      let album;
      if (!(album = albums[albumKey])) {
        album = {
          id: await this.snowflake.getId(),
          artist_id: artist.id,
          name: track.album || 'Unknown Album'
        };
        albums[albumKey] = album;
      }

      let _track = {
        id: await this.snowflake.getId(),
        title: track.title,
        duration: track.durationMillis,
        track_number: track.trackNumber,
        track_number_of: track.totalTrackCount,
        disc_number: track.discNumber,
        disc_number_of: track.totalDiscCount,
        size: track.estimatedSize,
        genre: track.genre,
        album_id: album.id,
        artist_id: artist.id,
        path: trackId,
        service_id: this.name
      };

      _tracks.push(_track);

      elasticTracks.push({
        id: _track.id,
        title: _track.title,
        artist: track.artist,
        album: track.album,
        genre: _track.genre,
        path: _track.path,
        service: _track.service_id
      });

      if (playlistTracks[trackId]) {
        playlistTracks[trackId].forEach(playlistId => {
          _playlistTracks.push({
            track_id: _track.id,
            playlist_id: playlistId
          })
        });
      }
    }
    console.log(Date.now() - startedAt, 'ms.', 'Done preparing data structures.');

    console.log(Date.now() - startedAt, 'ms.', 'Inserting artists...');

    await this.database.sequelize.transaction(async (t) => {
      for (let _artists of _.chunk(Object.keys(artists).map(artistName => artists[artistName]), this.getBatchSize())) {
        await this.database.artist.bulkCreate(_artists, {
          individualHooks: true,
          transaction: t
        });
      }

      console.log(Date.now() - startedAt, 'ms.', 'Inserting albums...');
      for (let _albums of _.chunk(Object.keys(albums).map(albumHash => albums[albumHash]), this.getBatchSize())) {
        await this.database.album.bulkCreate(_albums, {
          individualHooks: true,
          transaction: t
        });
      }

      console.log(Date.now() - startedAt, 'ms.', 'Inserting tracks...');
      for (let __tracks of _.chunk(_tracks, this.getBatchSize())) {
        await this.database.track.bulkCreate(__tracks, {
          individualHooks: true,
          transaction: t
        });
      }
      console.log(Date.now() - startedAt, 'ms.', 'Inserting playlist_tracks...');
      for (let __playlistTracks of _.chunk(_playlistTracks, this.getBatchSize())) {
        await this.database.playlist_tracks.bulkCreate(__playlistTracks, {
          individualHooks: true,
          transaction: t
        });
      }
    });

    console.log(Date.now() - startedAt, 'ms.', 'Indexing in elastic...');
    await this.trackController.indexInElasticsearch(elasticTracks);

    console.log('loaded in : ', Date.now() - startedAt, 'ms.');


    async function fetchTracks(token, i) {
      if (i === LIMIT) return [];
      let tracksData = await pm.getAllTracksAsync({ nextPageToken: token });
      if (!tracksData.nextPageToken) return tracksData.data.items;
      return tracksData.data.items.concat(await fetchTracks(tracksData.nextPageToken, ++i));
    }

    async function fetchPlayLists() {
      return (await pm.getPlayListsAsync()).data.items;
    }

    async function fetchPlayListEntries(token, i) {
      if (i === LIMIT) return [];
      let playListEntriesData = await pm.getPlayListEntriesAsync({ nextPageToken: token });
      if (!playListEntriesData.nextPageToken) return playListEntriesData.data.items;
      return playListEntriesData.data.items.concat(await fetchTracks(playListEntriesData.nextPageToken, ++i));
    }
  }

  getStream(path) {
    return pm.getStreamAsync(path);
  }
}
