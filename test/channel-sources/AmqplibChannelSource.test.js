const { strictEqual: eq } = require('assert');
const { beforeEach, describe, it } = require('zunit');
const { EventEmitter } = require('events');
const ScampEvents = require('../../lib/ScampEvents');
const { AmqplibChannelSource, AmqplibConnectionSource, ConnectionDecorator, ChannelDecorator, Counter } = require('../..');
const { CachingConnectionSource } = require('../../lib/connection-sources');

describe('AmqplibConnectionSource', () => {

  let connectionSource;
  let decorator;

  beforeEach(() => {
    const amqplib = new AmqplibStub();
    const connectionDecorator = new ConnectionDecorator({ counter: new Counter() });
    const amqplibConnectionSource = new AmqplibConnectionSource({ amqplib, decorator: connectionDecorator });
    connectionSource = new CachingConnectionSource({ connectionSource: amqplibConnectionSource });
    decorator = new ChannelDecorator({ counter: new Counter });
  });

  describe('x_scamp', () => {

    it('should assign x_scamp.id to regular channels', async () => {
      const channelSource = new AmqplibChannelSource({ connectionSource, decorator });

      const channel = await channelSource.getChannel();
      eq(channel.x_scamp.id, 'amqp://guest@localhost:5672/?1-1');
    });

    it('should assign x_scamp.id to confirm channels', async () => {
      const channelSource = new AmqplibChannelSource({ connectionSource, decorator });

      const channel = await channelSource.getConfirmChannel();
      eq(channel.x_scamp.id, 'amqp://guest@localhost:5672/?1-1');
    });

    it('should assign incremental x_scamp.id', async () => {
      const channelSource = new AmqplibChannelSource({ connectionSource, decorator });

      const channel1 = await channelSource.getChannel();
      eq(channel1.x_scamp.id, 'amqp://guest@localhost:5672/?1-1');

      const channel2 = await channelSource.getConfirmChannel();
      eq(channel2.x_scamp.id, 'amqp://guest@localhost:5672/?1-2');
    });

  });

  describe('Lost Channels', () => {

    it('should emit a lost event on channel close', async () => {
      const channelSource = new AmqplibChannelSource({ connectionSource, decorator });
      const channel = await channelSource.getConfirmChannel();
      let events = 0;

      channel.on(ScampEvents.LOST, () => events++);

      channel.emit('close');

      eq(events, 1);
    });

    it('should emit a lost event on connection error', async () => {
      const channelSource = new AmqplibChannelSource({ connectionSource, decorator });
      const channel = await channelSource.getConfirmChannel();
      let events = 0;

      channel.on(ScampEvents.LOST, () => events++);

      channel.emit('error');

      eq(events, 1);
    });

    it('should only emit one lost event', async () => {
      const channelSource = new AmqplibChannelSource({ connectionSource, decorator });
      const channel = await channelSource.getConfirmChannel();
      let events = 0;

      channel.on(ScampEvents.LOST, () => events++);
      channel.on('error', () => {});

      channel.emit('error', new Error('Oh Noes'));
      channel.emit('error', new Error('Oh Noes'));
      channel.emit('close');
      channel.emit('close');

      eq(events, 1);

    });

  });
});

class AmqplibStub {
  async connect() {
    return new ConnectionStub();
  }
}

class ConnectionStub extends EventEmitter {
  async createChannel() {
    return new EventEmitter();
  }
  async createConfirmChannel() {
    return new EventEmitter();
  }
}