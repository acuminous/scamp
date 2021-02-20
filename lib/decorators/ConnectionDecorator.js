const ScampEvent = require('../enums/ScampEvent');
const Counter = require('../utils/Counter');
const counter = new Counter();

module.exports = class ConnectionDecorator {

  constructor(props = {}) {
    this._counter = props.counter || counter;
  }

  decorate(connectionUrl, connection) {
    const count = this._counter.incrementAndGet(connectionUrl);
    const x_scamp = {
      id: `${connectionUrl}#${count}`,
      open: true,
    };

    connection.once(ScampEvent.LOST, () => x_scamp.open = false);

    return Object.assign(connection, { x_scamp } );
  }
};