let instance;

module.exports = class Counter {

  constructor() {
    this._counter = {};
  }

  static getInstance() {
    if (!instance) instance = new Counter();
    return instance;
  }

  get(key) {
    return this._counter[key] || 0;
  }

  incrementAndGet(key) {
    if (this._counter[key] === undefined) this._counter[key] = 0;
    this._counter[key]++;
    return this._counter[key];
  }

  delete(key) {
    delete this._counter[key];
  }

  clear() {
    this._counter = {};
  }
};