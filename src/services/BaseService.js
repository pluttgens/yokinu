export default class BaseService {
  constructor(name, params = { config: {}, controllers: {} }) {
    this.name = name;
    this.config = params.config;
    this.database = params.database;
    this.trackController = params.controllers.track;
    this.artistController = params.controllers.artist;
    this.albumController = params.controllers.album;
    this.snowflake = params.snowflake;
  }

  init() {
    return this.database.service.findOrCreate({
      where: {
        id: this.name
      }
    });
  }

  async load(params) {

  }

  getStream(path) {

  }

  putStream(req, body) {

  }
}
