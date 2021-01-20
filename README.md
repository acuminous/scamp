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


### Producers
```js
const connectionSource = new SimpleConnectionSource();
const broker = new Broker({ connectionSource, options: brokerOptions });
const vhost = await broker.connect({ options: vhostOptions });
const queue = await vhost.declareQueue({ options: queueOptions });
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

