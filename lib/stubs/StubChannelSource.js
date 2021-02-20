const { ChannelTypes } = require('../enums');
const StubChannel = require('./StubChannel');
const StubConfirmChannel = require('./StubConfirmChannel');
const Counter = require('../utils/Counter');
const ScampEvents = require('../enums/ScampEvents');


const DEFAULT_GET_CHANNEL = () => new StubChannel();
const DEFAULT_GET_CONFIRM_CHANNEL = () => new StubConfirmChannel();

module.exports = class StubChannelSource {

  constructor(props = {}) {
    this._baseId = props.baseId || 'amqp://guest@localhost:5672#1';
    this._getChannel = props.getChannel || DEFAULT_GET_CHANNEL;
    this._getConfirmChannel = props.getConfirmChannel || DEFAULT_GET_CONFIRM_CHANNEL;
    this._counter = props.counter || Counter.getInstance();
    this._aquireChannelInvocations = 0;
    this._channelListeners = [];
    this._closed = false;
  }

  registerChannelListener(event, listener) {
    this._channelListeners.push({ event, listener });
    return this;
  }

  getChannel() {
    return this._acquireChannel(this._getChannel, ChannelTypes.REGULAR);
  }

  getConfirmChannel() {
    return this._acquireChannel(this._getConfirmChannel, ChannelTypes.CONFIRM);
  }

  async _acquireChannel(fn, type) {
    if (this._closed) throw new Error('The channel source is closed');
    const channel = fn(this._aquireChannelInvocations++);
    this._decorate(channel, type);
    this._addListeners(channel);
    return channel;
  }

  _decorate(channel, type) {
    const baseId = this._baseId;
    const count = this._counter.incrementAndGet(baseId);
    const x_scamp = {
      id: `${baseId}-${count}-${type[0]}`,
      type,
      open: true,
    };

    channel.once(ScampEvents.LOST, () => x_scamp.open = false);

    Object.assign(channel, { x_scamp } );
  }

  _addListeners(connection) {
    this._channelListeners.forEach(({ event, listener }) => {
      connection.addListener(event, listener);
    });
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
  }
};