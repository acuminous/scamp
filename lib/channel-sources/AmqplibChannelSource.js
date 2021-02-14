const debug = require('debug')('scamp:channel-sources:AmqplibChannelSource');
const ChannelDecorator = require('../decorators/ChannelDecorator');
const ScampEvents = require('../ScampEvents');

module.exports = class AmqplibChannelSource {

  constructor({ connectionSource, decorator = new ChannelDecorator() }) {
    this._connectionSource = connectionSource;
    this._decorator = decorator;
    this._channelListeners = [];
    this._closed = false;
  }

  registerChannelListener(event, listener) {
    this._channelListeners.push({ event, listener });
    return this;
  }

  async getChannel() {
    if (this._closed) throw new Error('The channel source is closed');
    return this._aquireChannel('regular', connection => connection.createChannel());
  }

  async getConfirmChannel() {
    if (this._closed) throw new Error('The channel source is closed');
    return this._aquireChannel('confirm', connection => connection.createConfirmChannel());
  }

  async _aquireChannel(type, fn) {
    const connection = await this._connectionSource.getConnection();
    const channel = await fn(connection);
    this._decorator.decorate(connection, channel, type);
    this._handleLostChannels(channel);
    this._addListeners(channel, this._channelListeners);
    debug('Acquired %s channel %s', type, channel.x_scamp.id);
    return channel;
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