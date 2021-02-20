const StubConnection = require('./StubConnection');
const { ConnectionDecorator } = require('../decorators');
const ScampEvent = require('../enums/ScampEvent');

const DEFAULT_AQUIRE = async () => new StubConnection();

module.exports = class StubConnectionSource {

  constructor(props = {}) {
    this.id = props.id || Math.ceil(Math.random() * 1000000);
    this.aquire = props.aquire || DEFAULT_AQUIRE;
    this.count = 0;
    this.decorator = new ConnectionDecorator();
    this.connectionListeners = [];
    this.closed = false;
  }

  registerConnectionListener(event, listener) {
    this.connectionListeners.push({ event, listener });
    return this;
  }

  async getConnection() {
    if (this.closed) throw new Error('The connection source is closed');
    const connection = await this.aquire(this.count++);
    this.decorator.decorate(this.id, connection);
    this._addListeners(connection, this.connectionListeners);
    connection.emit(ScampEvent.ACQUIRED, connection);
    return connection;
  }

  _addListeners(connection, listeners) {
    listeners.forEach(({ event, listener }) => {
      connection.addListener(event, listener);
    });
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
  }
};