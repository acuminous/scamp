const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const MultiConnectionSource = require('./MultiConnectionSource');
const ResilientConnectionSource = require('./ResilientConnectionSource');

module.exports = class HighAvailabiltyConnectionSource {

  constructor({ amqplib, nodes }) {
    const amqplibConnectionSources = nodes.map(node => new AmqplibConnectionSource({ amqplib, params: node }));
    const multiConnectionSource = new MultiConnectionSource({ connectionSources: amqplibConnectionSources });
    this._connectionSource = new ResilientConnectionSource({ connectionSource: multiConnectionSource });
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