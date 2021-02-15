const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const StickyConnectionSource = require('./StickyConnectionSource');
const ResilientConnectionSource = require('./ResilientConnectionSource');

module.exports = class DedicatedConnectionSource {

  constructor({ amqplib, connectionOptions, socketOptions }) {
    const amqplibConnectionSource = new AmqplibConnectionSource({ amqplib, connectionOptions, socketOptions });
    const stickyConnectionSource = new StickyConnectionSource({ connectionSources: amqplibConnectionSource });
    const resilientConnectionSource = new ResilientConnectionSource({ connectionSource: stickyConnectionSource });
    this._connectionSource = resilientConnectionSource;
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