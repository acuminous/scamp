const debug = require('debug')('scamp:connection-sources:CachingConnectionSource');
const { Lock } = require('../utils');
const ScampEvents  = require('../ScampEvents');

module.exports = class CachingConnectionSource {

  constructor({ connectionSource }) {
    this._connectionSource = connectionSource;
    this._connection = null;
    this._lock = new Lock();
  }

  async getConnection() {
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
      debug('Flushing connection %s', this._connection.x_scamp.id);
      this._connection = null;
    });
  }

};