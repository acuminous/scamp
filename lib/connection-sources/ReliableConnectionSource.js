const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const CachingConnectionSource = require('./CachingConnectionSource');
const RecoveringConnectionSource = require('./RecoveringConnectionSource');

module.exports = class ReliableConnectionSource {

  constructor({ amqplib, connectionOptions, socketOptions }) {
    const amqplibConnectionSource = new AmqplibConnectionSource({ amqplib, connectionOptions, socketOptions });
    const cachingConnectionSource = new CachingConnectionSource({ connectionSources: amqplibConnectionSource });
    const recoveringConnectionSource = new RecoveringConnectionSource({ connectionSource: cachingConnectionSource });
    this._connectionSource = recoveringConnectionSource;
    this._closed = false;
  }

  registerConnectionListener(event, listener) {
    this._connectionSource.registerConnectionListener(event, listener);
    return this;
  }

  async getConnection() {
    if (this._closed) throw new Error('The connection source is closed');
    return this._connectionSource.getConnection();
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
  }
};