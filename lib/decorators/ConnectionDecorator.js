const { Counter } = require('../utils');
const counter = new Counter();

module.exports = class ConnectionDecorator {

  constructor(props = {}) {
    this._counter = props.counter || counter;
  }

  decorate(connectionUrl, connection) {

    const count = this._counter.incrementAndGet(connectionUrl);

    const x_scamp = {
      get id() {
        return `${connectionUrl}?${count}`;
      }
    };

    return Object.assign(connection, { x_scamp } );
  }
};