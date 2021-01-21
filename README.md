# scamp

## Connection Topologies

Scamp allows you to choose your connection topology by providing a range of pluggable connection and channel sources. For example...


#### Dedicated connection with a dedicated channel
      ┌─────────────────────────┐                                            ┌─────────────────────────┐
      │                         │                 Connection                 │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      │   Producer / Consumer   ╠══════════════════Channel═══════════════════╣          VHost          │
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
      │        Producer         │                                            │          VHost          │
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
      │        Producer         │                                            │          VHost          │
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
      │                         ╠════════════════════════════════════════════╣         VHost 1         │
      │                         │                                            │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │   Producer / Consumer   │                                            └─────────────────────────┘
      │                         │           Connection 2 (passive)           ┌─────────────────────────┐
      │                         ├ ─ ─ ─ ─ ─  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                         │
      │                         │                                            │                         │
      │                         ├ ─ ─ ─ ─ ─ ─ Channel 2 (passive) ─ ─ ─ ─ ─ ─│         VHost 2         │
      │                         │                                            │                         │
      │                         ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                         │
      └─────────────────────────┘                                            └─────────────────────────┘

### Exchanges
Exchanges are obtained from a Vhost using vhost.declareExchange. You can use the `passive` option to determine whether the exchange should be created if it doesn't already exist. Declaring an exchange passively which does not already exist will result in an error. Attempting to redeclare an exchange with different attributes will also result in an error. Once you have an instance of an exchange you can create a [producer](#producers) and start publishing messages.

```js
const exchange = await vhost.declareExchange({ 
  name: 'ex1', 
  type: 'topic', 
  passive: true, 
  arguments: { 
    'x-dead-letter-exchange': 'dlx'
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

