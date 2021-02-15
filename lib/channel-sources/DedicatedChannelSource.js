const AmqplibChannelSource = require('./AmqplibChannelSource');
const ResilientChannelSource = require('./ResilientChannelSource');
const StickyChannelSource = require('./StickyChannelSource');

module.exports = class DedicatedChannelSource {

  constructor({ connectionSource }) {
    const amqplibChannelSource = new AmqplibChannelSource({ connectionSource });
    const stickyChannelSource = new StickyChannelSource({ channelSource: amqplibChannelSource });
    const resilientChannelSource = new ResilientChannelSource({ channelSource: stickyChannelSource });
    this._channelSource = resilientChannelSource;
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