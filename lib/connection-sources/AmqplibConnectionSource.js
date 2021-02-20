const debug = require('debug')('scamp:connection-sources:AmqplibConnectionSource');
const ScampEvents = require('../enums/ScampEvents');
const Counter = require('../utils/Counter');
const AmqplibConnectOptions = require('./AmqplibConnectOptions');

module.exports = class AmqplibConnectionSource {

  constructor({ amqplib, counter = Counter.getInstance(), connectionOptions = {}, socketOptions = {} }) {
    this._amqplib = amqplib;
    this._counter = counter;
    this._connectOptions = new AmqplibConnectOptions({ connectionOptions, socketOptions });
    this._connectionListeners = [];
    this._closed = false;
  }

  registerConnectionListener(event, listener) {
    this._connectionListeners.push({ event, listener });
    return this;
  }

  async getConnection() {
    if (this._closed) throw new Error('The connection source is closed');
    const connection = await this._connect();
    this._handleLostConnections(connection);
    this._addListeners(connection, this._connectionListeners);
    connection.emit(ScampEvents.ACQUIRED, connection);
    return connection;
  }

  async _connect() {
    debug(`Connecting to %s`, this._connectOptions.loggableUrl);
    const connection = await this._amqplib.connect(this._connectOptions.unloggableConnectionOptions, this._connectOptions.socketOptions);
    this._decorate(connection);
    debug(`Acquired connection %s`, connection.x_scamp.id);
    return connection;
  }

  _decorate(connection) {
    const baseId = this._connectOptions.baseId;
    const count = this._counter.incrementAndGet(baseId);
    const x_scamp = {
      id: `${baseId}#${count}`,
      connectionOptions: this._connectOptions.connectionOptions,
      socketOptions: this._connectOptions.socketOptions,
      open: true,
    };

    connection.once(ScampEvents.LOST, () => x_scamp.open = false);

    Object.assign(connection, { x_scamp } );
  }

  _handleLostConnections(connection) {
    const onError = this._makeLostEmitter(connection, 'error');
    const onClose = this._makeLostEmitter(connection, 'close');
    const onLost = () => {
      connection.removeListener('error', onError);
      connection.removeListener('close', onClose);
    };

    this._addListeners(connection, [
      { event: ScampEvents.LOST, listener: onLost },
      { event: 'error', listener: onError },
      { event: 'close', listener: onClose },
    ]);
  }

  _makeLostEmitter(connection, event) {
    return () => {
      if (this._closed) return;
      debug('Received %s event from connection %s', event, connection.x_scamp.id);
      connection.emit(ScampEvents.LOST);
    };
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
