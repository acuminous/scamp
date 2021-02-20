module.exports = class RotatingConnectionSource {

  constructor({ connectionSources }) {
    this._connectionSources = connectionSources;
    this._index = 0;
    this._closed = false;
  }

  registerConnectionListener(event, listener) {
    this._connectionSources.forEach(connectionSource => connectionSource.registerConnectionListener(event, listener));
    return this;
  }

  async getConnection() {
    if (this._closed) throw new Error('The connection source is closed');
    try {
      return this._connectionSources[this._index].getConnection();
    } finally {
      this._next();
    }
  }

  _next() {
    this._index = (this._index + 1) % this._connectionSources.length;
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
  }

};