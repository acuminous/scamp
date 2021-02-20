const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const RotatingConnectionSource = require('./RotatingConnectionSource');
const RecoveringConnectionSource = require('./RecoveringConnectionSource');
const CachingConnectionSource = require('./CachingConnectionSource');

module.exports = class HighAvailabiltyConnectionSource {

  constructor({ amqplib, optionSets }) {
    const amqplibConnectionSources = optionSets.map(({ connectionOptions, socketOptions }) => new AmqplibConnectionSource({ amqplib, connectionOptions, socketOptions }));
    const rotatingConnectionSource = new RotatingConnectionSource({ connectionSources: amqplibConnectionSources });
    const cachingConnectionSource = new CachingConnectionSource({ connectionSource: rotatingConnectionSource });
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