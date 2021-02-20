const debug = require('debug')('scamp:connection-sources:RecoveringConnectionSource');
const ExponentialBackoff = require('../utils/ExponentialBackoff');
const defaultRetryStrategy = new ExponentialBackoff().build();

module.exports = class RecoveringConnectionSource {

  constructor({ connectionSource, retryStrategy = defaultRetryStrategy }) {
    this._connectionSource = connectionSource;
    this._retryStrategy = retryStrategy;
    this._retries = {};
    this._closed = false;
  }

  registerConnectionListener(event, listener) {
    this._connectionSource.registerConnectionListener(event, listener);
    return this;
  }

  async getConnection() {
    if (this._closed) throw new Error('The connection source is closed');
    return new Promise((resolve, reject) => this._getConnection(resolve, reject));
  }

  async _getConnection(resolve, reject, attempt = 0) {
    try {
      const connection = await this._connectionSource.getConnection();
      resolve(connection);
    } catch(error) {
      debug('Error acquiring connection: %o', error);
      this._maybeRetry(resolve, reject, error, attempt + 1);
    }
  }

  _maybeRetry(resolve, reject, error, attempt) {
    const delay = this._retryStrategy(attempt);
    if (delay >= 0) {
      debug('Defering connection acquisition for %d seconds', delay / 1000);
      this._deferRetry(resolve, reject, attempt, delay);
    } else {
      debug('Failed to acquire connection after %d attempts', attempt);
      reject(new Error(error));
    }
  }

  _deferRetry(resolve, reject, attempt, delay) {
    const timerId = setTimeout(() => {
      delete this._retries[timerId];
      this._getConnection(resolve, reject, attempt);
    }, delay).unref();
    this._retries[timerId] = reject;
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
    this._cancelRetries();
  }

  _cancelRetries() {
    Object.entries(this._retries).forEach(([ timerId, reject ]) => {
      debug('Cancelling deferred connection acquisition');
      clearTimeout(timerId);
      reject(new Error('The connection source is closed'));
    });
  }
};