const debug = require('debug')('scamp:AmqplibConnectionSource');
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
  }

  async getConnection() {
    const connection = await this._connect();
    debug(`Acquired connection %s`, connection.x_scamp.id);
    this._handleLostConnections(connection);
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

    this._addListeners(connection, { [ScampEvents.LOST]: onLost, error: onError, close: onClose });
  }

  _makeLostEmitter(connection, event) {
    return () => {
      debug('Received %s event from connection %s', event, connection.x_scamp.id);
      connection.emit(ScampEvents.LOST);
    };
  }

  _addListeners(connection, listeners) {
    for (const [event, listener] of Object.entries(listeners)) {
      connection.addListener(event, listener);
    }
  }
};