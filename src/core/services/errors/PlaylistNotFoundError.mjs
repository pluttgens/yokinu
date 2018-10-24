import ExtendableError from 'es6-error';

export default class PlaylistNotFoundError extends ExtendableError {
  constructor (playlistId, message = 'No playlist found.') {
    if (playlistId)
      message = `No playlist found for this playlist ID : ${playlistId}`;
    super(message);
  }
}
