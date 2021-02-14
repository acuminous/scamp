# scamp

## Connection Topologies

Scamp allows you to choose your connection topology by providing a range of pluggable connection and channel sources. For example...


#### Dedicated connection with a dedicated channel
      ┌─────────────────────────┐                                            ┌─────────────────────────┐
      │                         │                 Connection                 │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      │   Producer / Consumer   ╠══════════════════Channel═══════════════════╣      Virtual Host       │
      │                         │                                            │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      │                         │                                            │                         │
      └─────────────────────────┘                                            └─────────────────────────┘


#### Dedicated connection with a channel pool
      ┌─────────────────────────┐                                            ┌─────────────────────────┐
      │                         │                 Connection                 │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      │                         ╠═════════════════Channel 1══════════════════╣                         │
      │                         │                                            │                         │
      │        Producer         │                                            │      Virtual Host       │
      │                         │                                            │                         │
      │                         ╠═════════════════Channel 2══════════════════╣                         │
      │                         │                                            │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      └─────────────────────────┘                                            └─────────────────────────┘



#### Connection pool with dedicated channels
      ┌─────────────────────────┐                Connection 1                ┌─────────────────────────┐
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      │                         ╠════════════════Channel 1═══════════════════╣                         │
      │                         │                                            │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │        Producer         │                                            │      Virtual Host       │
      │                         │                Connection 2                │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      │                         ╠═════════════════Channel 2══════════════════╣                         │
      │                         │                                            │                         │
      │                         ├────────────────────────────────────────────┤                         │
      └─────────────────────────┘                                            └─────────────────────────┘

#### Dedicated active/passive connection with dedicated channel

      ┌─────────────────────────┐                Connection 1                ┌─────────────────────────┐
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                 Channel 1                  │                         │
      │                         ╠════════════════════════════════════════════╣      Virtual Host       │
      │                         │                                            │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │   Producer / Consumer   │                                            └─────────────────────────┘
      │                         │           Connection 2 (passive)           ┌─────────────────────────┐
      │                         ├ ─ ─ ─ ─ ─  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                         │
      │                         │                                            │                         │
      │                         ├ ─ ─ ─ ─ ─ ─ Channel 2 (passive) ─ ─ ─ ─ ─ ─│      Virtual Host       │
      │                         │                                            │                         │
      │                         ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                         │
      └─────────────────────────┘                                            └─────────────────────────┘

### Broker
The broker is a container for one or more virtual hosts and repository for common config such as encryption profiles and content parsers.

```js
const broker = new Broker({
  encryption: {
    'profile-1': {
      key: 'blah-blah-blah',
      algorithm: 'aes256',
      ivLength: 16,
    }
  },
  parsers: {
    'application/json': new JsonParser(),
    'application/xml', new XmlParser(),
  }
});
```

You can shutdown all vhosts managed by the broker using `broker.shutdown`. You can also `nuke`, or `purge` matching queues and exchanges, which is useful for testing. e.g.
```js
let broker;

beforeAll(async () => {
  broker = await initBroker();
});

beforeEach(async () => {
  await broker.purge();
});

afterAll(async () => {
  await broker.nuke(/^test_/);
});
```

### Vhosts
Virtual Hosts are obtained by connecting to a broker.

```js
const connectionSource = new SimpleConnectionSource();
const vhost = await broker.connect({
  connectionSource,
  options: {
    host: 'localhost',
    port: 5672,
    name: 'vh1',
    user: 'bob',
    password: 'secret',
    params: {
      heartbeat: 10,
    },
    socket: {
      timeout: 10000,
    }
  }
});
```

#### Options
| Option | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| host   | string | yes | localhost | The host to connect to |
| port   | number | yes | 5672 | The port to connect to |
| name | string | yes | / | The name of the virtual host. Use / for RabbitMQ's default virtual host |
| user | string | yes | guest | The username to connect with. |
| password | string | yes | password | The password to connect with. |
| params | object | no |  | For specifying RabbitMQ [query params](https://www.rabbitmq.com/uri-query-parameters.html). You should consider setting a heartbeat, channel_max and connection_timeout |
| socket | object | no | { clientProperties: { name: 'scamp', version: version } } | For specifying underlying socket options. |

### Exchanges
Exchanges are obtained from a virtual host using vhost.declareExchange. You can use the `passive` option to determine whether the exchange should be created if it doesn't already exist. Declaring an exchange passively which does not already exist will result in an error. Attempting to redeclare an exchange with different attributes will also result in an error. Once you have an instance of an exchange you can create a [producer](#producers) and start publishing messages.

```js
const exchange = await vhost.declareExchange({
  name: 'ex1',
  type: 'topic',
  passive: false,
  arguments: {
    'x-dead-letter-exchange': 'dlx',
  },
});
```

#### Options
| Option | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| name   | string | yes | | The exchange name |
| type   | string | yes | topic | The exchange type. Must be one of [direct](https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchange-direct), [fanout](https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchange-fanout), [topic](https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchange-topic) or [headers](https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchange-headers) |
| passive | boolean | no | true | Set to false to create the exchange if it does not already exist |
| durable | boolean | no | true | If true, the exchange will survive broker restarts. |
| internal | boolean | no | false | If true, messages cannot be published directly to the exchange (i.e., it can only be the target of bindings, or possibly create messages ex-nihilo). |
| autoDelete | boolean | no | false | If true, the exchange will be destroyed once the number of bindings for which it is the source drop to zero. |
| alternateExchange | string | no | | An exchange to send messages to if this exchange can’t route them to any queues. |
| arguments | object | no | | Use to specify custom RabbitMQ options, e.g. x-dead-letter-exchange |


### Queues
Like exchanges, queues are also obtained from a virtual host using vhost.declareQueue. You can use the `passive` option to determine whether the queue should be created if it doesn't already exist. Declaring a queue passively which does not already exist will result in an error. Attempting to redeclare a queue with different attributes will also result in an error. Once you have an instance of an queue you can create a [producer](#producers) and start publishing messages.


```js
const queue = await vhost.declareQueue({
  name: 'q1',
  passive: false,
  arguments: {
    'x-message-ttl': 1000,
  },
});
```

### Binding
You can bind queues to exchanges as follows...
```js
// Fanout exchange
await queue.bind(exchange);

// Topic or direct exchange
await queue.bind(exchange, { keys: ['a.b.c'] });

// Headers exchange
await queue.bind(exchange, { arguments { format: 'pdf', type: 'report', 'x-match': 'all' } });
```

Or bind two exchanges like this...
```js
// Fanout exchange
await exchange1.bind(exchange2);

// Topic or direct exchange
await exchange1.bind(exchange2, { keys: ['a.b.c'] });

// Header exchange
await exchange1.bind(exchange2, { arguments: { format: 'pdf', type: 'report', 'x-match': 'all' } });
```

You can also unbind, but you must be careful to use binding keys which actually exist.
```js
await queue.unbind(exchange { keys });
await exchange.unbind(exchange2, { keys });
```


#### Options
| Option | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| name   | string | yes | | The queue name |
| passive | boolean | no | true | Set to false to create the queue if it does not already exist |
| durable | boolean | no | true | If true, the queue will survive broker restarts, modulo the effects of exclusive and autoDelete |
| exclusive | boolean | no | false | If true, scopes the queue to the connection. |
| autoDelete | boolean | no | false | If true, the queue will be deleted when the number of consumers drops to zero. |
| alternateExchange | string | no | | An exchange to send messages to if this exchange can’t route them to any queues. |
| arguments | object | no | | Use to specify custom RabbitMQ options, e.g. x-dead-letter-exchange |

### Producers
Producers are obtained from queues or exchanges. They require a channel source for obtaining channels. For example...
```js
const channelSource = new SimpleChannelSource();
const producer = queue.getProducer({ channelSource })
  .setMessageId(uuid)
  .useConfirmChannel(true)
  .detectContentType(true)
  .encryptContent('profile-1'})
  .timeout(1000);

await new Promise((resolve, reject) => {
  producer.publish('hello world')
    .on('success', message => {
      resolve();
    })
    .on('returned', message => {
      // Already resolved
      console.warn(`Message was returned ${message.properties.messageId}`);
    })
    .on('error', (err, message) => {
      reject(err);
    })
    .on('busy', (message) => {
      // May want to apply back pressure to whatever is calling the publisher
    })
    .on('ready', () => {
      // May want to relax back pressure
    });
});

await producer.close();
await vhost.disconnect();
```

### Consumers
Consumers are obtained from a queue. They require a channel source for obtaining channels. For example...

```js
const channelSource = new SimpleChannelSource();
const consumer = queue.createConsumer({ channelSource })
  .setPrefetch(10)
  .setContentType('application/xml')
  .decryptContent(true)
  .parseContent(true);

// The consumer will only start consuming messages once the on message handler is registered
consumer.subscribe()
  .on('message', (message) => {
    console.log(message.content);
    await message.ack();
  }).on('error', (err, message) => {
    console.error(err);
  });
```
