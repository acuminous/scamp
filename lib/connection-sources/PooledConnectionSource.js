const PeristentConnectionSource = require('./PersistentConnectionSource');
const MultiConnectionSource = require('./MultiConnectionSource');

module.exports = class PooledConnectionSource {

  constructor({ size, amqplib, connectionOptions, socketOptions }) {
    const connectionSources = new Array(size).fill().map(() => new PeristentConnectionSource({ amqplib, connectionOptions, socketOptions }));
    const multiConnectionSource = new MultiConnectionSource({ connectionSources });
    this._connectionSource = multiConnectionSource;
    this._closed = false;
  }

  registerChannelListener(event, listener) {
    this._connectionSource.registerConnectionListener(event, listener);
    return this;
  }

  async getChannel() {
    if (this._closed) throw new Error('The connection source is closed');
    return this._connectionSource.getChannel();
  }

  async getConfirmChannel() {
    if (this._closed) throw new Error('The connection source is closed');
    return this._connectionSource.getConfirmChannel();
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
  }
};