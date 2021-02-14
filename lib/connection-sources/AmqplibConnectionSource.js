const debug = require('debug')('scamp:connection-sources:AmqplibConnectionSource');
const ScampEvents = require('../ScampEvents');
const ConnectionDecorator = require('../decorators/ConnectionDecorator');

const defaults = {
  protocol: 'amqp',
  hostname: 'localhost',
  port: 5672,
  vhost: '',
  password: 'guest',
  username: 'guest',
};

module.exports = class AmqplibConnectionSource {

  constructor({ amqplib, decorator = new ConnectionDecorator(), params = {}, socketOptions = {} }) {
    this._amqplib = amqplib;
    this._decorator = decorator;
    this._params = { ...defaults, ...params };
    this._socketOptions = socketOptions;
    this._connectionListeners = [];
  }

  registerConnectionListener(event, listener) {
    this._connectionListeners.push({ event, listener });
    return this;
  }

  async getConnection() {
    const connection = await this._connect();
    debug(`Acquired connection %s`, connection.x_scamp.id);
    this._handleLostConnections(connection);
    this._addListeners(connection, this._connectionListeners);
    return connection;
  }

  async _connect() {
    const url = this._getLoggableConnectionUrl();
    debug(`Connecting to %s`, url);
    const connection = await this._amqplib.connect(this._params, this._socketOptions);
    this._decorator.decorate(url, connection);
    return connection;
  }

  _getLoggableConnectionUrl() {
    const { protocol, username, hostname, port, vhost } = this._params;
    const trimmedVhost = vhost === '/' ? '' : vhost;
    return `${protocol}://${username}@${hostname}:${port}/${trimmedVhost}`;
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
      debug('Received %s event from connection %s', event, connection.x_scamp.id);
      connection.emit(ScampEvents.LOST);
    };
  }

  _addListeners(connection, listeners) {
    listeners.forEach(({ event, listener }) => {
      connection.addListener(event, listener);
    });
  }
};