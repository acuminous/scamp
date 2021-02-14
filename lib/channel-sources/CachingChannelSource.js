const { Lock } = require('../utils');
const ScampEvents  = require('../ScampEvents');

module.exports = class CachingChannelSource {

  constructor({ channelSource }) {
    this._channelSource = channelSource;
    this._channels = { regular: null, confirm: null };
    this._lock = new Lock();
  }

  async getChannel() {
    return this._aquireChannel('regular', () => this._channelSource.getChannel());
  }

  async getConfirmChannel() {
    return this._aquireChannel('confirm', () => this._channelSource.getConfirmChannel());
  }

  async _aquireChannel(type, fn) {
    if (this._channels[type]) return this._channels[type];
    await this._lock.acquire();
    try {
      if (this._channels[type]) return this._channels[type];
      this._channels[type] = await fn();
      this._channels[type].once(ScampEvents.LOST, () => this._channels[type] = null);
      return this._channels[type];
    } finally {
      this._lock.release();
    }
  }

};