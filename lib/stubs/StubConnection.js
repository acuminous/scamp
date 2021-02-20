const { EventEmitter } = require('events');
const { IllegalOperationError } = require('amqplib');
const StubChannel = require('./StubChannel');
const StubConfirmChannel = require('./StubConfirmChannel');

const DEFAULT_CREATE_CHANNEL = async () => new StubChannel();
const DEFAULT_CREATE_CONFIRM_CHANNEL = async () => new StubConfirmChannel();

module.exports = class StubConnection extends EventEmitter {

  constructor(props = {}) {
    super();
    this._createChannel = props.createChannel || DEFAULT_CREATE_CHANNEL;
    this._createConfirmChannel = props.createConfirmChannel || DEFAULT_CREATE_CONFIRM_CHANNEL;
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
    return this._createChannel();
  }

  async createConfirmChannel() {
    if (this._isClosed()) throw new IllegalOperationError(`Connection closed (${this._getReason()})`, this._error && this._error.stack);
    return this._createConfirmChannel();
  }

  _isClosed() {
    return this._closed || this._error;
  }

  _getReason() {
    return this._error ? this._error.toString() : `by client`;
  }
};