const debug = require('debug')('scamp:connection-sources:CachingConnectionSource');
const { Lock } = require('../utils');
const ScampEvents  = require('../ScampEvents');

module.exports = class CachingConnectionSource {

  constructor({ connectionSource }) {
    this._connectionSource = connectionSource;
    this._connection = null;
    this._lock = new Lock();
    this._closed = false;
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
    this._connection.once(ScampEvents.LOST, () => {
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