const { strictEqual: eq } = require('assert');
const { describe, it } = require('zunit');
const { EventEmitter } = require('events');
const { CachingChannelSource } = require('../..');
const ScampEvents = require('../../lib/ScampEvents');

describe('CachingChannelSource', () => {

  describe('Regular Channels', () => {

    it('should acquire a new channel when the cache is empty', async () => {
      const stubChannelSource = new ChannelSourceStub();
      const channelSource = new CachingChannelSource({ channelSource: stubChannelSource });

      const channel = await channelSource.getChannel();

      eq(channel.id, 1);
    });

    it('should reuse the existing channel when the cache is primed', async () => {
      const stubChannelSource = new ChannelSourceStub();
      const channelSource = new CachingChannelSource({ channelSource: stubChannelSource });

      const channel1 = await channelSource.getChannel();
      const channel2 = await channelSource.getChannel();

      eq(channel1.id, 1);
      eq(channel2.id, 1);
    });

    it('should acquire a new channel after loss', async () => {
      const stubChannelSource = new ChannelSourceStub();
      const channelSource = new CachingChannelSource({ channelSource: stubChannelSource });

      const channel1 = await channelSource.getChannel();
      channel1.emit(ScampEvents.LOST);

      const channel2 = await channelSource.getChannel();

      eq(channel1.id, 1);
      eq(channel2.id, 2);
    });

    it('should synchronise new channel acquisition', async () => {
      const stubChannelSource = new ChannelSourceStub();
      const channelSource = new CachingChannelSource({ channelSource: stubChannelSource });

      const channel1 = await channelSource.getChannel();
      eq(channel1.id, 1);
      channel1.emit(ScampEvents.LOST);

      const connections = await Promise.all(new Array(100).fill().map(() => channelSource.getChannel()));
      connections.forEach(channel2 => {
        eq(channel2.id, 2);
      });
    });

  });
});



class ChannelSourceStub {
  constructor() {
    this.id = 1;
  }

  async getChannel() {
    return Object.assign(new EventEmitter(), { id: this.id++ });
  }
}