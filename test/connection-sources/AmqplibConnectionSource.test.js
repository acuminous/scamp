const { strictEqual: eq, rejects } = require('assert');
const { StubAmqplib, AmqplibConnectionSource, Counter, ScampEvents } = require('../..');

describe('AmqplibConnectionSource', () => {

  let amqplib;

  beforeEach(() => {
    amqplib = new StubAmqplib();
    Counter.getInstance().clear();
  });

  describe('registerConnectionListener', () => {

    it('should add registered listeners to new connections', async() => {
      let events = 0;
      const connectionSource = new AmqplibConnectionSource({ amqplib });

      connectionSource.registerConnectionListener('close', () => events++ );
      const connection = await connectionSource.getConnection();
      await connection.close();

      eq(events, 1);
    });
  });

  describe('getConnection', () => {

    it('should decorate connection with x_scamp.id using default parameters', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib });

      const connection = await connectionSource.getConnection();
      eq(connection.x_scamp.id, 'amqp://guest@localhost:5672#1');
    });

    it('should decorate connection with x_scamp.id using explicit parameters', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib, connectionOptions: { protocol: 'amqps', hostname: 'foo', username: 'bar', port: 123, vhost: 'baz' } });

      const connection = await connectionSource.getConnection();
      eq(connection.x_scamp.id, 'amqps://bar@foo:123/baz#1');
    });

    it('should decorate connection with x_scamp.id using default vhost', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib, connectionOptions: { vhost: '/' } });

      const connection = await connectionSource.getConnection();
      eq(connection.x_scamp.id, 'amqp://guest@localhost:5672/#1');
    });

    it('should assign incremental x_scamp.id', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib });

      const connection1 = await connectionSource.getConnection();
      eq(connection1.x_scamp.id, 'amqp://guest@localhost:5672#1');

      const connection2 = await connectionSource.getConnection();
      eq(connection2.x_scamp.id, 'amqp://guest@localhost:5672#2');
    });
  });

  describe('Lost Connections', () => {

    it('should emit a lost event on connection close', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib });
      const connection = await connectionSource.getConnection();
      let events = 0;

      connection.on(ScampEvents.LOST, () => events++);

      connection.emit('close');

      eq(events, 1);
    });

    it('should emit a lost event on connection error', async () => {
      let events = 0;
      const connectionSource = new AmqplibConnectionSource({ amqplib });
      const connection = await connectionSource.getConnection();
      connection.on(ScampEvents.LOST, () => events++);

      connection.emit('error', new Error('Oh Noes'));

      eq(events, 1);
    });

    it('should only emit one lost event', async () => {
      let events = 0;
      const connectionSource = new AmqplibConnectionSource({ amqplib });
      const connection = await connectionSource.getConnection();
      connection.on(ScampEvents.LOST, () => events++);
      connection.on('error', () => {});

      connection.emit('error', new Error('Oh Noes'));
      connection.emit('error', new Error('Oh Noes'));
      connection.emit('close');
      connection.emit('close');

      eq(events, 1);
    });

    it('should not emit a lost event when the connection source is closed', async () => {
      let events = 0;
      const connectionSource = new AmqplibConnectionSource({ amqplib });
      const connection = await connectionSource.getConnection();
      connection.on(ScampEvents.LOST, () => events++);
      await connectionSource.close();

      connection.emit('close');

      eq(events, 0);
    });
  });

  describe('registerCustomListener', () => {

    it('should support custom connection event listeners', async () => {
      let events = 0;

      const connectionSource = new AmqplibConnectionSource({ amqplib });
      connectionSource.registerConnectionListener('close', () => events++);
      const connection = await connectionSource.getConnection();

      connection.emit('close');

      eq(events, 1);
    });
  });

  describe('close', async () => {

    it('should reject attempts to get a connection when closed', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib });
      await connectionSource.close();

      await rejects(() => connectionSource.getConnection(), /The connection source is closed/);
    });

    it('should tolerate repeated closures', async () => {
      const connectionSource = new AmqplibConnectionSource({ amqplib });
      await connectionSource.close();
      await connectionSource.close();
    });
  });
});
