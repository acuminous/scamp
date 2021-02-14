const debug = require('debug')('scamp:connection-sources:ResilientConnectionSource');

const defaultRetryStrategy = (attempt) => {
  const backoff = 2 ** attempt * 100;
  const direction = Math.floor(Math.random() * 2) ? 1 : -1;
  const variation = direction * Math.random() * backoff / 4;
  const delay = Math.round(backoff + variation, 3);
  return Math.min(delay, 60000);
};

module.exports = class ResilientConnectionSource {

  constructor({ connectionSource, retryStrategy = defaultRetryStrategy }) {
    this._connectionSource = connectionSource;
    this._retryStrategy = retryStrategy;
  }

  async getConnection() {
    return new Promise((resolve, reject) => this._getConnection(resolve, reject));
  }

  async _getConnection(resolve, reject, attempt = 0) {
    try {
      const connection = await this._connectionSource.getConnection();
      resolve(connection);
    } catch(error) {
      debug('Error acquiring connection: %o', error);
      attempt++;
      const delay = this._retryStrategy(attempt);
      if (delay >= 0) {
        debug('Retrying connection in %d seconds', delay / 1000);
        setTimeout(() => {
          this._getConnection(resolve, reject, attempt);
        }, delay).unref();
      } else {
        debug('Failed to acquire connection after %d attempts', attempt);
        reject(new Error(error));
      }
    }
  }
};