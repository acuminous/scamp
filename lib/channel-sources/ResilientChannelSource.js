const debug = require('debug')('scamp:connection-sources:ResilientChannelSource');
const ExponentialBackoff = require('../utils/ExponentialBackoff');
const ChannelType = require('../enums/ChannelType');
const defaultRetryStrategy = new ExponentialBackoff().build();

module.exports = class ResilientChannelSource {

  constructor({ channelSource, retryStrategy = defaultRetryStrategy }) {
    this._channelSource = channelSource;
    this._retryStrategy = retryStrategy;
    this._retries = {};
    this._closed = false;
  }

  registerChannelListener(event, listener) {
    this._channelSource.registerChannelListener(event, listener);
    return this;
  }

  async getChannel() {
    if (this._closed) throw new Error('The channel source is closed');
    return new Promise((resolve, reject) => this._getChannel(ChannelType.REGULAR, () => this._channelSource.getChannel(), resolve, reject));
  }

  async getConfirmChannel() {
    if (this._closed) throw new Error('The channel source is closed');
    return new Promise((resolve, reject) => this._getChannel(ChannelType.CONFIRM, () => this._channelSource.getConfirmChannel(), resolve, reject));
  }

  async _getChannel(type, fn, resolve, reject, attempt = 0) {
    try {
      const channel = await fn();
      resolve(channel);
    } catch(error) {
      debug('Error acquiring %s channel: %o', type, error);
      this._maybeRetry(type, fn, resolve, reject, error, attempt + 1);
    }
  }

  _maybeRetry(type, fn, resolve, reject, error, attempt) {
    const delay = this._retryStrategy(attempt);
    if (delay >= 0) {
      debug('Defering %s channel acquisition for %d seconds', type, delay / 1000);
      this._deferRetry(type, fn, resolve, reject, attempt, delay);
    } else {
      debug('Failed to acquire %s channel after %d attempts', type, attempt);
      reject(new Error(error));
    }
  }

  _deferRetry(type, fn, resolve, reject, attempt, delay) {
    const timerId = setTimeout(() => {
      delete this._retries[timerId];
      this._getChannel(type, fn, resolve, reject, attempt);
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
      debug('Cancelling deferred channel acquisition');
      clearTimeout(timerId);
      reject(new Error('The channel source is closed'));
    });
  }
};