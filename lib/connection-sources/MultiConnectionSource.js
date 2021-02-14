module.exports = class MultiConnectionSource {

  constructor({ connectionSources }) {
    this._connectionSources = connectionSources;
    this._index = 0;
  }

  async getConnection() {
    const connection = await this._connectionSources[this._index].getConnection();
    this._next();
    return connection;
  }

  _next() {
    this._index = (this._index + 1) % this._connectionSources.length;
  }

};