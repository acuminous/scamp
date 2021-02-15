/* eslint-disable no-implicit-globals */

const amqplib = require('amqplib');
const { shuffle } = require('d3');
const { HighAvailabiltyConnectionSource, StickyConnectionSource, StickyChannelSource, ResilientChannelSource, AmqplibChannelSource, ScampEvent } = require('../..');
const keepAlive = setInterval(() => {}, 600000);
const optionSets = shuffle([ 5672, 5673, 5674 ]).map(port => ({ connectionOptions: { port }, socketOptions: { timeout: 5000 } }));

const [ topologyConnectionSource, producerConnectionSource, consumerConnectionSource ] = new Array(3).fill().map(() => new HighAvailabiltyConnectionSource({ amqplib, optionSets })
  .registerConnectionListener('error', console.error)
  .registerConnectionListener(ScampEvent.ACQUIRED, ({ x_scamp }) => console.log('Connected to', x_scamp.id)));

(async () => {
  try {
    await createTopology(topologyConnectionSource);
    const cancelProducer = await produce(producerConnectionSource);
    const cancelConsumer = await consume(consumerConnectionSource);
    addShutdownListerners(cancelProducer, cancelConsumer);
  } catch (err) {
    console.error(err);
  }
})();

async function createTopology(connectionSource) {
  const channelSource = new AmqplibChannelSource({ connectionSource })
    .registerChannelListener('error', console.error);
  const channel = await channelSource.getChannel();
  await channel.assertQueue('test');
  await channel.close();
  await channel.connection.close();
}

async function produce(connectionSource) {
  const channelSource = createResilientChannelSource({ connectionSource })
    .registerChannelListener('error', console.error);

  const timer = setInterval(async () => {
    const channel = await channelSource.getChannel();
    await channel.sendToQueue('test', Buffer.from(new Date().toString()));
  }, 1000).unref();

  return async () => {
    clearInterval(timer);
    const channel = await channelSource.getChannel();
    await channelSource.close();
    await channel.close();
    await channel.connection.close();
    console.log('Producer cancelled');
  };
}

async function consume(connectionSource) {
  const channelSource = createResilientChannelSource({ connectionSource })
    .registerChannelListener('error', console.error);

  const channel = await channelSource.getChannel();
  const { consumerTag } = await channel.consume('test', async (message) => {
    if (message === null) return;

    const content = message.content.toString();
    console.log('>>>', content);
    await channel.ack(message);
  });

  const reconsume = () => consume(channelSource);
  channel.once(ScampEvent.LOST, reconsume);

  return async () => {
    await channel.cancel(consumerTag);
    channel.removeListener(ScampEvent.LOST, reconsume);
    await channelSource.close();
    await channel.close();
    await channel.connection.close();
    console.log('Consumer cancelled');
  };
}

function createResilientChannelSource({ connectionSource }) {
  const stickyConnectionSource = new StickyConnectionSource({ connectionSource });
  const amqplibChannelSource = new AmqplibChannelSource({ connectionSource: stickyConnectionSource })
    .registerChannelListener('error', console.error);
  const stickyChannelSource = new StickyChannelSource({ channelSource: amqplibChannelSource });
  return new ResilientChannelSource({ channelSource: stickyChannelSource });
}

function addShutdownListerners(...tasks) {
  ['SIGINT', 'SIGTERM'].forEach(event => process.on(event, () => shutdown(tasks)));
}

async function shutdown(tasks) {
  console.log('Shutting Down');
  await Promise.all(tasks.map(task => task()));
  clearInterval(keepAlive);
  console.log('Goodbye');
}