module.exports = class MultiConnectionSource {

  constructor({ connectionSources }) {
    this._connectionSources = connectionSources;
    this._index = 0;
    this._closed = false;
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