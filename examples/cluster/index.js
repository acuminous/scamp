/* eslint-disable no-implicit-globals */

const amqplib = require('amqplib');
const { shuffle } = require('d3');
const { AmqplibConnectionSource, MultiConnectionSource, CachingConnectionSource, CachingChannelSource } = require('../..');
const { AmqplibChannelSource } = require('../../lib/channel-sources');
const ScampEvents = require('../../lib/ScampEvents');

const multiConnectionSource = createMultiConnectionSource();
const producerChannelSource = createCachingChannelSource({ connectionSource: multiConnectionSource });
const consumerChannelSource = createCachingChannelSource({ connectionSource: multiConnectionSource });

(async () => {
  try {
    produce(producerChannelSource);
    consume(consumerChannelSource);
  } catch (err) {
    console.error(err);
  }
})();

function createMultiConnectionSource() {
  const node1 = new AmqplibConnectionSource({ amqplib, params: { port: 5672 } });
  const node2 = new AmqplibConnectionSource({ amqplib, params: { port: 5673 } });
  const node3 = new AmqplibConnectionSource({ amqplib, params: { port: 5674 } });
  return new MultiConnectionSource({ connectionSources: shuffle([ node1, node2, node3 ]) });
}

function createCachingChannelSource({ connectionSource }) {
  const cachingConnectionSource = new CachingConnectionSource({ connectionSource });
  const amqplibChannelSource = new AmqplibChannelSource({ connectionSource: cachingConnectionSource });
  return new CachingChannelSource({ channelSource: amqplibChannelSource });
}

async function produce(producerChannelSource) {
  const channel = await producerChannelSource.getChannel();
  channel.on('error', console.error);

  await channel.assertQueue('test');

  setInterval(async () => channel.sendToQueue('test', Buffer.from('message')), 1000).unref();
}

async function consume(consumerChannelSource) {
  const channel = await consumerChannelSource.getChannel();
  channel.on('error', console.error);

  await channel.assertQueue('test');

  const consumerTag = await channel.consume('test', async (message) => {
    if (message === null) {
      await channel.cancel(consumerTag);
      return;
    }

    const content = message.content.toString();
    console.log(content);
    await channel.ack(message);
  });

  channel.once(ScampEvents.LOST, () => consume(consumerChannelSource));
}
