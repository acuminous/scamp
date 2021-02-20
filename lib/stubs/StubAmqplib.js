const StubConnection = require('./StubConnection');

module.exports = class StubAmqplib {

  constructor(props = {}) {
    this._connections = props.connections || new Array(10).fill().map(() => new StubConnection());
  }

  connect() {
    return this._connections.pop();
  }
};