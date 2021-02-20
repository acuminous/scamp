const { EventEmitter } = require('events');
const { IllegalOperationError } = require('amqplib');

module.exports = class StubChannel extends EventEmitter {

  constructor(props = {}) {
    super();
    this.connection = props.connection || null;
    this._closed = props.closed || null;
    this._error = props.error || null;
  }

  bork(error) {
    this._error = error;
    this.emit('error', error);
    this.emit('close');
  }

  async close() {
    if (this._isClosed()) throw new IllegalOperationError('Channel closed');
    this._closed = true;
    this.emit('close');
  }

  _isClosed() {
    return this._closed || this._error;
  }

};