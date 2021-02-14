const debug = require('debug')('scamp:channel-sources:AmqplibChannelSource');
const ChannelDecorator = require('../decorators/ChannelDecorator');
const ScampEvents = require('../ScampEvents');

module.exports = class AmqplibChannelSource {

  constructor({ connectionSource, decorator = new ChannelDecorator() }) {
    this._connectionSource = connectionSource;
    this._decorator = decorator;
    this._channelListeners = [];
  }

  registerChannelListener(event, listener) {
    this._channelListeners.push({ event, listener });
    return this;
  }

  async getChannel() {
    const channel = await this._aquireChannel(connection => connection.createChannel());
    debug('Acquired regular channel', channel.x_scamp.id);
    return channel;
  }

  async getConfirmChannel() {
    const channel = await this._aquireChannel(connection => connection.createConfirmChannel());
    debug('Acquired confirm channel', channel.x_scamp.id);
    return channel;
  }

  async _aquireChannel(fn) {
    const connection = await this._connectionSource.getConnection();
    const channel = await fn(connection);
    this._decorator.decorate(connection, channel);
    this._handleLostChannels(channel);
    this._addListeners(channel, this._channelListeners);
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
      debug('Received %s event from channel %s', event, channel.x_scamp.id);
      channel.emit(ScampEvents.LOST);
    };
  }

  _addListeners(connection, listeners) {
    listeners.forEach(({ event, listener }) => {
      connection.addListener(event, listener);
    });
  }
};