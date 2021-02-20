const { ok, strictEqual: eq, notStrictEqual: neq, rejects } = require('assert');
const { StickyChannelSource, StubChannelSource, ScampEvent, ChannelType } = require('../..');

describe('StickyChannelSource', () => {

  [{ type: ChannelType.REGULAR, method: 'getChannel' }, { type: ChannelType.CONFIRM, method: 'getConfirmChannel' }].forEach(({ type, method }) => {

    describe('registerChannelListener', () => {

      it('should add registered listeners to underlying channel source', async() => {
        let events = 0;
        const stubChannelSource = new StubChannelSource();
        const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });
        channelSource.registerChannelListener('close', () => events++ );

        const channel = await channelSource[method]();
        channel.emit('close');

        eq(events, 1);
      });
    });

    describe(`getChannel (${type})`, () => {

      it(`should acquire a new ${type} channel when the cache is empty`, async () => {
        const stubChannelSource = new StubChannelSource();
        const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });

        const channel = await channelSource[method]();

        ok(channel);

        eq(channel.x_scamp.type, type);
      });

      it(`should reuse the existing ${type} channel when the cache is primed`, async () => {
        const stubChannelSource = new StubChannelSource();
        const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });

        const channel1 = await channelSource[method]();
        const channel2 = await channelSource[method]();

        ok(channel1);
        ok(channel2);
        eq(channel1, channel2);
      });

      it(`should acquire a new ${type} channel after loss`, async () => {
        const stubChannelSource = new StubChannelSource();
        const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });

        const channel1 = await channelSource[method]();

        channel1.emit(ScampEvent.LOST);

        const channel2 = await channelSource[method]();

        ok(channel1);
        ok(channel2);
        neq(channel1, channel2);
      });

      it(`should synchronise new ${type} channel acquisition`, async () => {
        const stubChannelSource = new StubChannelSource();
        const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });

        const channels = await Promise.all(new Array(100).fill().map(() => channelSource[method]()));
        channels.reduce((channel1, channel2) => {
          ok(channel1);
          ok(channel2);
          eq(channel1, channel2);
          return channel1;
        });
      });
    });

    describe(`close ${type}`, async () => {

      it(`should close cached ${type} channels`, async () => {
        const stubChannelSource = new StubChannelSource();
        const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });

        const channel = await channelSource[method]();

        await channelSource.close();

        eq(channel.closed, true);
      });

      it(`should reject attempts to get a ${type} channel when closed`, async () => {
        const stubChannelSource = new StubChannelSource();
        const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });
        await channelSource.close();

        await rejects(() => channelSource[method](), /The channel source is closed/);
      });
    });
  });

  describe('close', async () => {

    it('should tolerate repeated closures', async () => {
      const stubChannelSource = new StubChannelSource();
      const channelSource = new StickyChannelSource({ channelSource: stubChannelSource });
      await channelSource.close();
      await channelSource.close();
    });
  });
});
