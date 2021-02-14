const { strictEqual: eq } = require('assert');
const { beforeEach, describe, it } = require('zunit');
const { EventEmitter } = require('events');
const ScampEvents = require('../../lib/ScampEvents');
const { AmqplibConnectionSource, ConnectionDecorator, Counter } = require('../..');

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

      connection.on(ScampEvents.LOST, () => events++);

      connection.emit('close');

      eq(events, 1);
    });

    it('should emit a lost event on connection error', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator });
      const connection = await connectionSource.getConnection();
      let events = 0;

      connection.on(ScampEvents.LOST, () => events++);

      connection.emit('error', new Error('Oh Noes'));

      eq(events, 1);
    });

    it('should only emit one lost event', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib, decorator });
      const connection = await connectionSource.getConnection();
      let events = 0;

      connection.on(ScampEvents.LOST, () => events++);
      connection.on('error', () => {});

      connection.emit('error', new Error('Oh Noes'));
      connection.emit('error', new Error('Oh Noes'));
      connection.emit('close');
      connection.emit('close');

      eq(events, 1);

    });

  });
});

class AmqplibStub {
  async connect() {
    return new EventEmitter();
  }
}