const DedicatedChannelSource = require('./DedicatedChannelSource');
const MultiChannelSource = require('./MultiChannelSource');

module.exports = class PooledChannelSource {

  constructor({ connectionSource, size }) {
    const channelSources = new Array(size).fill().map(() => new DedicatedChannelSource({ connectionSource }));
    const multiChannelSource = new MultiChannelSource({ channelSources });
    this._channelSource = multiChannelSource;
    this._closed = false;
  }

  registerChannelListener(event, listener) {
    this._channelSource.registerChannelListener(event, listener);
    return this;
  }

  async getChannel() {
    if (this._closed) throw new Error('The channel source is closed');
    return this._channelSource.getChannel();
  }

  async getConfirmChannel() {
    if (this._closed) throw new Error('The channel source is closed');
    return this._channelSource.getConfirmChannel();
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
  }
};