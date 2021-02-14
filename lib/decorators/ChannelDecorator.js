const { Counter } = require('../utils');
const ScampEvents = require('../ScampEvents');
const counter = new Counter();

module.exports = class ChannelDecorator {

  constructor(props = {}) {
    this._counter = props.counter || counter;
  }

  decorate(connection, channel) {
    const connectionId = connection.x_scamp.id;
    const count = this._counter.incrementAndGet(connectionId);
    connection.once(ScampEvents.LOST, () => this._counter.delete(connectionId));

    const x_scamp = {
      get id() {
        return `${connectionId}-${count}`;
      },
    };

    return Object.assign(channel, { x_scamp } );
  }
};