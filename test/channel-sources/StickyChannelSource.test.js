const { strictEqual: eq, rejects } = require('assert');
const { describe, it } = require('zunit');
const { EventEmitter } = require('events');
const { StickyChannelSource, ScampEvent } = require('../..');

describe('StickyChannelSource', () => {

  describe('registerChannelListener', () => {

    it('should add registered listeners to underlying channel source', async() => {
      const stubChannelSource = new StubChannelSource();
      const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });

      channelSource.registerChannelListener('close', () =>  {});

      eq(stubChannelSource.channelListeners.length, 1);
      eq(stubChannelSource.channelListeners[0].event, 'close');
    });
  });

  [{ type: 'regular', method: 'getChannel' }, { type: 'confirm', method: 'getConfirmChannel' }].forEach(({ type, method }) => {

    describe(`getChannel (${type})`, () => {

      it(`should acquire a new ${type} channel when the cache is empty`, async () => {
        const stubChannelSource = new StubChannelSource();
        const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });

        const channel = await channelSource[method]();

        eq(channel.x_scamp.id, 1);
        eq(channel.x_scamp.type, type);
      });

      it(`should reuse the existing ${type} channel when the cache is primed`, async () => {
        const stubChannelSource = new StubChannelSource();
        const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });

        const channel1 = await channelSource[method]();
        const channel2 = await channelSource[method]();

        eq(channel1.x_scamp.id, 1);
        eq(channel2.x_scamp.id, 1);
      });

      it(`should acquire a new ${type} channel after loss`, async () => {
        const stubChannelSource = new StubChannelSource();
        const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });

        const channel1 = await channelSource[method]();

        channel1.emit(ScampEvent.LOST);

        const channel2 = await channelSource[method]();

        eq(channel1.x_scamp.id, 1);
        eq(channel2.x_scamp.id, 2);
      });

      it(`should synchronise new ${type} channel acquisition`, async () => {
        const stubChannelSource = new StubChannelSource();
        const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });

        const channel1 = await channelSource[method]();
        eq(channel1.x_scamp.id, 1);
        channel1.emit(ScampEvent.LOST);

        const connections = await Promise.all(new Array(100).fill().map(() => channelSource[method]()));
        connections.forEach(channel2 => {
          eq(channel2.x_scamp.id, 2);
        });
      });
    });
  });

  describe('close', async () => {

    it('should closes cached channels', async () => {
      const stubChannelSource = new StubChannelSource();
      const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });

      const channel1 = await channelSource.getChannel();
      const channel2 = await channelSource.getConfirmChannel();

      await channelSource.close();

      eq(channel1.x_scamp.open, false);
      eq(channel2.x_scamp.open, false);
    });

    it('should reject attempts to get a regular channel when closed', async () => {
      const stubChannelSource = new StubChannelSource();
      const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });
      await channelSource.close();

      await rejects(() => channelSource.getChannel(), /The channel source is closed/);
    });

    it('should reject attempts to get a confirm channel when closed', async () => {
      const stubChannelSource = new StubChannelSource();
      const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });
      await channelSource.close();

      await rejects(() => channelSource.getConfirmChannel(), /The channel source is closed/);
    });

    it('should tolerate repeated closures', async () => {
      const stubChannelSource = new StubChannelSource();
      const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });
      await channelSource.close();
      await channelSource.close();
    });
  });
});

class StubChannelSource {
  constructor() {
    this.id = 1;
    this.channelListeners = [];
  }

  registerChannelListener(event, listener) {
    this.channelListeners.push({ event, listener });
  }

  async getChannel() {
    const x_scamp = { id: this.id++, type: 'regular', open: true };
    return Object.assign(new EventEmitter(), { x_scamp }, { close: async () => x_scamp.open = false });
  }

  async getConfirmChannel() {
    const x_scamp = { id: this.id++, type: 'confirm', open: true };
    return Object.assign(new EventEmitter(), { x_scamp }, { close: async () => x_scamp.open = false });
  }
}