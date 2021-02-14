const debug = require('debug')('scamp:connection-sources:StickyConnectionSource');
const { Lock } = require('../utils');
const ScampEvent  = require('../enums/ScampEvent');

module.exports = class StickyConnectionSource {

  constructor({ connectionSource }) {
    this._connectionSource = connectionSource;
    this._connection = null;
    this._lock = new Lock();
    this._closed = false;
  }

  registerConnectionListener(event, listener) {
    this._connectionSource.registerConnectionListener(event, listener);
    return this;
  }

  async getConnection() {
    if (this._closed) throw new Error('The connection source is closed');
    if (this._connection) return this._connection;
    await this._lock.acquire();
    try {
      if (this._connection) return this._connection;
      await this._connect();
      this._handleLostConnections();
      return this._connection;
    } finally {
      this._lock.release();
    }
  }

  async _connect() {
    this._connection = await this._connectionSource.getConnection();
    debug('Cached connection %s', this._connection.x_scamp.id);
  }

  _handleLostConnections() {
    this._connection.once(ScampEvent.LOST, () => {
      debug('Flushing connection %s from cache', this._connection.x_scamp.id);
      this._connection = null;
    });
  }

  async _flushCache() {
    if (!this._connection) return;
    debug('Flushing connection %s from cache', this._connection.x_scamp.id);
    this._connection = null;
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
    await this._closeConnection();
  }

  async _closeConnection() {
    if (!this._connection || !this._connection.x_scamp.open) return;

    await this._lock.acquire();
    try {
      await this._connection.close();
    } finally {
      this._lock.release();
    }
  }

};