const { EventEmitter } = require('events');
const { IllegalOperationError } = require('amqplib');
const StubChannel = require('./StubChannel');
const StubConfirmChannel = require('./StubConfirmChannel');

module.exports = class StubConnection extends EventEmitter {

  constructor(props = {}) {
    super();
    this._channels = props.channels || new Array(10).fill().map(() => new StubChannel({ connection: this }));
    this._confirmChannels = props.confirmChannels || new Array(10).fill().map(() => new StubConfirmChannel({ connection: this }));
    this._closed = props.closed || null;
    this._error = props.error || null;
  }

  get closed() {
    return this._closed;
  }

  bork(error) {
    this._error = error;
    this.emit('error', error);
    this.emit('close', error);
    return this;
  }

  async close() {
    if (this._isClosed()) throw new IllegalOperationError(`Connection closed (${this._getReason()})`, this._error && this._error.stack);
    this._closed = true;
    this.emit('close');
    return this;
  }

  async createChannel() {
    if (this._isClosed()) throw new IllegalOperationError(`Connection closed (${this._getReason()})`, this._error && this._error.stack);
    return this._channels.pop();
  }

  async createConfirmChannel() {
    if (this._isClosed()) throw new IllegalOperationError(`Connection closed (${this._getReason()})`, this._error && this._error.stack);
    return this._confirmChannels.pop();
  }

  _isClosed() {
    return this._closed || this._error;
  }

  _getReason() {
    return this._error ? this._error.toString() : `by client`;
  }
};