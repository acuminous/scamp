const debug = require('debug')('scamp:channel-sources:CachingChannelSource');
const { Lock } = require('../utils');
const { ChannelType, ScampEvent }  = require('../enums');

module.exports = class CachingChannelSource {

  constructor({ channelSource }) {
    this._channelSource = channelSource;
    this._channels = { regular: null, confirm: null };
    this._lock = new Lock();
    this._closed = false;
  }

  registerChannelListener(event, listener) {
    this._channelSource.registerChannelListener(event, listener);
    return this;
  }

  async getChannel() {
    return this._getChannel(ChannelType.REGULAR, () => this._channelSource.getChannel());
  }

  async getConfirmChannel() {
    return this._getChannel(ChannelType.CONFIRM, () => this._channelSource.getConfirmChannel());
  }

  async _getChannel(type, fn) {
    if (this._closed) throw new Error('The channel source is closed');
    if (this._channels[type]) return this._channels[type];

    await this._lock.acquire();
    try {
      if (this._channels[type]) return this._channels[type];

      this._channels[type] = await fn();
      this._channels[type].once(ScampEvent.LOST, () => this._flushCache(type));
      debug(`Cached %s channel %s`, type, this._channels[type].x_scamp.id);
      return this._channels[type];
    } finally {
      this._lock.release();
    }
  }

  async _flushCache(type) {
    if (!this._channels[type]) return;
    debug(`Flushing %s channel %s from cache`, type, this._channels[type].x_scamp.id);
    this._channels[type] = null;
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
    await this._closeChannels();
  }

  async _closeChannels() {
    if (!this._hasOpenChannels()) return;

    await this._lock.acquire();
    try {
      const closeChannelsTask = this._getCloseChannelTasks();
      await Promise.all(closeChannelsTask);
    } finally {
      await this._lock.release();
    }
  }

  _hasOpenChannels() {
    return this._getOpenChannels().length >= 0;
  }

  _getOpenChannels() {
    return Object.values(this._channels).filter(channel => channel && channel.x_scamp.open);
  }

  _getCloseChannelTasks() {
    return this._getOpenChannels().map(channel => channel.close());
  }
};