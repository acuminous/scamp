/* eslint-disable no-implicit-globals */

const amqplib = require('amqplib');
const { shuffle } = require('d3');
const { AmqplibConnectionSource, MultiConnectionSource, StickyConnectionSource, ResilientConnectionSource, StickyChannelSource, ResilientChannelSource, AmqplibChannelSource, ScampEvent } = require('../..');

const clusterConnectionSource = createClusterConnectionSource();
const producerChannelSource = createResilientChannelSource({ connectionSource: clusterConnectionSource });
const consumerChannelSource = createResilientChannelSource({ connectionSource: clusterConnectionSource });

(async () => {
  try {
    await createTopology(clusterConnectionSource);
    produce(producerChannelSource);
    consume(consumerChannelSource);
  } catch (err) {
    console.error(err);
  }
})();
setInterval(() => {}, 600000);

function createClusterConnectionSource() {
  const ports = [ 5672, 5673, 5674 ];
  const connectionSources = shuffle(ports).map(port => new AmqplibConnectionSource({ amqplib, params: { port } })
    .registerConnectionListener('error', console.error));
  const multiConnectionSource = new MultiConnectionSource({ connectionSources });
  return new ResilientConnectionSource({ connectionSource: multiConnectionSource });
}

function createResilientChannelSource({ connectionSource }) {
  const stickyConnectionSource = new StickyConnectionSource({ connectionSource });
  const amqplibChannelSource = new AmqplibChannelSource({ connectionSource: stickyConnectionSource })
    .registerChannelListener('error', console.error);
  const stickyChannelSource = new StickyChannelSource({ channelSource: amqplibChannelSource });
  return new ResilientChannelSource({ channelSource: stickyChannelSource });
}

async function createTopology(connectionSource) {
  const channelSource = new AmqplibChannelSource({ connectionSource })
    .registerChannelListener('error', console.error);
  const channel = await channelSource.getChannel();
  await channel.assertQueue('test');
  await channel.close();
  await channel.connection.close();
}

async function produce(channelSource) {
  setInterval(async () => {
    const channel = await channelSource.getChannel();
    channel.sendToQueue('test', Buffer.from(new Date().toString()));
  }, 1000).unref();
}

async function consume(channelSource) {
  const channel = await channelSource.getChannel();
  const consumerTag = await channel.consume('test', async (message) => {
    if (message === null) {
      await channel.cancel(consumerTag);
      return;
    }

    const content = message.content.toString();
    console.log('>>>', content);
    await channel.ack(message);
  });

  channel.once(ScampEvent.LOST, () => consume(channelSource));
}
