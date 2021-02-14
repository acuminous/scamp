const { Counter } = require('../utils');
const ScampEvents = require('../ScampEvents');
const counter = new Counter();

module.exports = class ChannelDecorator {

  constructor(props = {}) {
    this._counter = props.counter || counter;
  }

  decorate(connection, channel, type) {
    const connectionId = connection.x_scamp.id;
    const count = this._counter.incrementAndGet(connectionId);
    const x_scamp = {
      id: `${connectionId}-${count}`,
      type,
      open: true,
    };

    connection.once(ScampEvents.LOST, () => this._counter.delete(connectionId));
    channel.once(ScampEvents.LOST, () => x_scamp.open = false);

    return Object.assign(channel, { x_scamp } );
  }
};