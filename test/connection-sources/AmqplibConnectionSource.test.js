const { strictEqual: eq, rejects } = require('assert');
const { beforeEach, describe, it } = require('zunit');
const { EventEmitter } = require('events');
const { AmqplibConnectionSource, ConnectionDecorator, Counter, ScampEvent } = require('../..');

describe('AmqplibConnectionSource', () => {

  let amqplib;
  let decorator;

  beforeEach(() => {
    amqplib = new AmqplibStub();
    decorator = new ConnectionDecorator({ counter: new Counter() });
  });

  describe('x_scamp', () => {

    it('should assign x_scamp.id with default parameters', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator });

      const connection = await connectionSource.getConnection();
      eq(connection.x_scamp.id, 'amqp://guest@localhost:5672/?1');
    });

    it('should assign x_scamp.id with explicit parameters', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator, params: { protocol: 'amqps', hostname: 'foo', username: 'bar', port: 123, vhost: 'baz' } });

      const connection = await connectionSource.getConnection();
      eq(connection.x_scamp.id, 'amqps://bar@foo:123/baz?1');
    });

    it('should assign x_scamp.id with default vhost', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator, params: { vhost: '/' } });

      const connection = await connectionSource.getConnection();
      eq(connection.x_scamp.id, 'amqp://guest@localhost:5672/?1');
    });

    it('should assign incremental x_scamp.id', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator });

      const connection1 = await connectionSource.getConnection();
      eq(connection1.x_scamp.id, 'amqp://guest@localhost:5672/?1');

      const connection2 = await connectionSource.getConnection();
      eq(connection2.x_scamp.id, 'amqp://guest@localhost:5672/?2');
    });
  });

  describe('Lost Connections', () => {

    it('should emit a lost event on connection close', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator });
      const connection = await connectionSource.getConnection();
      let events = 0;

      connection.on(ScampEvent.LOST, () => events++);

      connection.emit('close');

      eq(events, 1);
    });

    it('should emit a lost event on connection error', async () => {
      let events = 0;
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator });
      const connection = await connectionSource.getConnection();
      connection.on(ScampEvent.LOST, () => events++);

      connection.emit('error', new Error('Oh Noes'));

      eq(events, 1);
    });

    it('should only emit one lost event', async () => {
      let events = 0;
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator });
      const connection = await connectionSource.getConnection();
      connection.on(ScampEvent.LOST, () => events++);
      connection.on('error', () => {});

      connection.emit('error', new Error('Oh Noes'));
      connection.emit('error', new Error('Oh Noes'));
      connection.emit('close');
      connection.emit('close');

      eq(events, 1);
    });

    it('should not emit a lost event when the connection source is closed', async () => {
      let events = 0;
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator });
      const connection = await connectionSource.getConnection();
      connection.on(ScampEvent.LOST, () => events++);
      await connectionSource.close();

      connection.emit('close');

      eq(events, 0);
    });
  });

  describe('registerCustomListener', () => {

    it('should support custom connection event listeners', async () => {
      let events = 0;

      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator });
      connectionSource.registerConnectionListener('close', () => events++);
      const connection = await connectionSource.getConnection();

      connection.emit('close');

      eq(events, 1);
    });
  });

  describe('close', async () => {

    it('should reject attempts to get a connection when closed', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator });
      await connectionSource.close();

      await rejects(() => connectionSource.getConnection(), /The connection source is closed/);
    });

    it('should tolerate repeated closures', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator });
      await connectionSource.close();
      await connectionSource.close();
    });
  });
});

class AmqplibStub {
  async connect() {
    return new EventEmitter();
  }
}