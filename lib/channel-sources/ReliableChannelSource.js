const AmqplibChannelSource = require('./AmqplibChannelSource');
const RecoveringChannelSource = require('./RecoveringChannelSource');
const CachingChannelSource = require('./CachingChannelSource');

module.exports = class ReliableChannelSource {

  constructor({ connectionSource }) {
    const amqplibChannelSource = new AmqplibChannelSource({ connectionSource });
    const cachingChannelSource = new CachingChannelSource({ channelSource: amqplibChannelSource });
    const recoveringChannelSource = new RecoveringChannelSource({ channelSource: cachingChannelSource });
    this._channelSource = recoveringChannelSource;
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