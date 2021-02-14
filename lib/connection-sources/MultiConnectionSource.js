module.exports = class MultiConnectionSource {

  constructor({ connectionSources }) {
    this._connectionSources = connectionSources;
    this._index = 0;
  }

  async getConnection() {
    try {
      return this._connectionSources[this._index].getConnection();
    } finally {
      this._next();
    }
  }

  _next() {
    this._index = (this._index + 1) % this._connectionSources.length;
  }

};