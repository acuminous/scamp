const StubConnection = require('./StubConnection');
const ScampEvent = require('../enums/ScampEvent');
const Counter = require('../utils/Counter');

const DEFAULT_CONNECT = async () => new StubConnection();

module.exports = class StubConnectionSource {

  constructor(props = {}) {
    this._baseId = props.baseId || 'amqp://guest@localhost:5672';
    this._connect = props.connect || DEFAULT_CONNECT;
    this._connectInvocations = 0;
    this._counter = props.counter || Counter.getInstance();
    this._connectionListeners = [];
    this._closed = false;
  }

  registerConnectionListener(event, listener) {
    this._connectionListeners.push({ event, listener });
    return this;
  }

  async getConnection() {
    if (this._closed) throw new Error('The connection source is closed');
    const connection = await this._connect(this._connectInvocations++);
    this._decorate(connection);
    this._addListeners(connection, this._connectionListeners);
    connection.emit(ScampEvent.ACQUIRED, connection);
    return connection;
  }

  _decorate(connection) {
    const baseId = this._baseId;
    const count = this._counter.incrementAndGet(baseId);
    const x_scamp = {
      id: `${baseId}#${count}`,
      open: true,
    };

    connection.once(ScampEvent.LOST, () => x_scamp.open = false);

    Object.assign(connection, { x_scamp } );
  }

  _addListeners(connection, listeners) {
    listeners.forEach(({ event, listener }) => {
      connection.addListener(event, listener);
    });
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
  }
};