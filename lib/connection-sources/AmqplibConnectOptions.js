const UrlBuilder = require('../utils/UrlBuilder');

const DEFAULT_CONNECTION_OPTIONS = {
  protocol: 'amqp',
  hostname: 'localhost',
  port: 5672,
  username: 'guest',
  password: 'guest',
};

const DEFAULT_TSL_CONNECTION_OPTIONS = {
  protocol: 'amqps',
  port: 5671,
};

module.exports = class AmqplibConnectOptions {
  constructor({ connectionOptions, socketOptions }) {
    this._connectionOptions = { ...this._getDefaultConnectionOptions(connectionOptions), ...connectionOptions };
    this._socketOptions = socketOptions;
    this._loggableUrl = this._buildLoggableUrl(this._connectionOptions);
  }

  get loggableUrl() {
    return this._loggableUrl;
  }

  get connectionOptions() {
    /* eslint-disable-next-line no-unused-vars */
    const { password, ...connectionOptions } = this._connectionOptions;
    return connectionOptions;
  }

  get socketOptions() {
    return this._socketOptions;
  }

  _getDefaultConnectionOptions({ protocol }) {
    return protocol === 'amqps' ? DEFAULT_TSL_CONNECTION_OPTIONS : DEFAULT_CONNECTION_OPTIONS;
  }

  _buildLoggableUrl({ protocol, hostname, port, username, vhost, channelMax, frameMax, heartbeat, locale, query }) {
    return new UrlBuilder()
      .protocol(protocol)
      .hostname(hostname)
      .port(port)
      .username(username)
      .pathname(vhost)
      .query({
        ...query,
        channelMax,
        frameMax,
        heartbeat,
        locale,
      })
      .build();
  }
};