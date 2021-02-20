const debug = require('debug')('scamp:channel-sources:AmqplibChannelSource');
const ScampEvents = require('../enums/ScampEvents');
const Counter = require('../utils/Counter');

module.exports = class AmqplibChannelSource {

  constructor({ connectionSource, counter = Counter.getInstance() }) {
    this._connectionSource = connectionSource;
    this._counter = counter;
    this._channelListeners = [];
    this._closed = false;
  }

  registerChannelListener(event, listener) {
    this._channelListeners.push({ event, listener });
    return this;
  }

  async getChannel() {
    if (this._closed) throw new Error('The channel source is closed');
    return this._getChannel('regular', connection => connection.createChannel());
  }

  async getConfirmChannel() {
    if (this._closed) throw new Error('The channel source is closed');
    return this._getChannel('confirm', connection => connection.createConfirmChannel());
  }

  async _getChannel(type, fn) {
    const connection = await this._connectionSource.getConnection();
    const channel = await fn(connection);
    this._decorate(channel, connection, type);
    this._handleLostChannels(channel);
    this._addListeners(channel, this._channelListeners);
    debug('Acquired %s channel %s', type, channel.x_scamp.id);
    channel.emit(ScampEvents.ACQUIRED, channel);
    return channel;
  }

  _decorate(channel, connection, type) {
    const baseId = connection.x_scamp.id;
    const count = this._counter.incrementAndGet(baseId);
    const x_scamp = {
      id: `${baseId}-${count}-${type[0]}`,
      type,
      open: true,
    };

    channel.once(ScampEvents.LOST, () => x_scamp.open = false);

    Object.assign(channel, { x_scamp } );
  }

  _handleLostChannels(channel) {
    const onError = this._makeLostEmitter(channel, 'error');
    const onClose = this._makeLostEmitter(channel, 'close');
    const onLost = () => {
      channel.removeListener('error', onError);
      channel.removeListener('close', onClose);
    };

    this._addListeners(channel, [
      { event: ScampEvents.LOST, listener: onLost },
      { event: 'error', listener: onError },
      { event: 'close', listener: onClose },
    ]);
  }

  _makeLostEmitter(channel, event) {
    return () => {
      if (this._closed) return;
      debug('Received %s event from channel %s', event, channel.x_scamp.id);
      channel.emit(ScampEvents.LOST);
    };
  }

  _addListeners(connection, listeners) {
    listeners.forEach(({ event, listener }) => {
      connection.addListener(event, listener);
    });
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
  }
};