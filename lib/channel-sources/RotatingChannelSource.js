module.exports = class RotatingConnectionSource {

  constructor({ channelSources }) {
    this._channelSources = channelSources;
    this._index = 0;
    this._closed = false;
  }

  registerChannelListener(event, listener) {
    this._channelSource.registerChannelListener(event, listener);
    return this;
  }

  async getChannel() {
    return this._getChannel(() => this._channelSources[this._index].getChannel());
  }

  async getConfirmChannel() {
    return this._getChannel(() => this._channelSources[this._index].getConfirmChannel());
  }

  async _getChannel(fn) {
    if (this._closed) throw new Error('The channel source is closed');
    try {
      return fn();
    } finally {
      this._next();
    }
  }
  _next() {
    this._index = (this._index + 1) % this._channelSources.length;
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
  }

};