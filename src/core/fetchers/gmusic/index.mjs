import PlayMusic from 'playmusic';
import Promise from 'bluebird';
import _ from 'lodash';
import Errors from '../errors/index';


const pm = new PlayMusic();
Promise.promisifyAll(pm);

class GMusicFetcher {
  constructor() {

  }

  async init() {
    await super.init();
    if (this.config.masterToken) {
      return pm
        .initAsync({
          androidId: this.config.androidId,
          masterToken: this.config.masterToken
        })
        .catch(e => Promise.reject(new Errors.InitializationError(e)));
    }

    return pm
      .loginAsync({
        email: this.config.email,
        password: this.config.password
      })
      .then(({androidId, masterToken}) => {
        this.androidId = androidId;
        this.masterToken = masterToken;
      })
      .catch(e => Promise.reject(new Errors.InitializationError(e)));
  }
}
