const { EventEmitter } = require('events');
const { IllegalOperationError } = require('amqplib');
module.exports = class StubConnection extends EventEmitter {

  constructor(props = {}) {
    super();
    this._closedBy = props.closedBy || null;
    this._error = props.error || null;
  }

  bork(error) {
    this._error = error;
    this.emit('error', error);
    this.emit('close', error);
  }

  async close() {
    if (this._isClosed()) throw new IllegalOperationError(`Connection closed (${this._getReason()})`, this._error && this._error.stack);
    this._closedBy = 'client';
    this.emit('close');
  }

  async createChannel() {
    if (this._isClosed()) throw new IllegalOperationError(`Connection closed (${this._getReason()})`, this._error && this._error.stack);
  }

  async createConfirmChannel() {
    if (this._isClosed()) throw new IllegalOperationError(`Connection closed (${this._getReason()})`, this._error && this._error.stack);
  }

  _isClosed() {
    return this._closedBy || this._error;
  }

  _getReason() {
    return this._error ? this._error.toString() : `by ${this._closedBy}`;
  }
};