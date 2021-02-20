const { strictEqual: eq, ok, rejects } = require('assert');
const { ResilientChannelSource, ChannelType, StubChannelSource, StubConfirmChannel, StubChannel } = require('../..');

describe('ResilientChannelSource', () => {

  const FAIL_FOREVER = () => {
    throw new Error('Oh Noes!');
  };

  [{ type: ChannelType.REGULAR, method: 'getChannel' }, { type: ChannelType.CONFIRM, method: 'getConfirmChannel' }].forEach(({ type, method }) => {

    describe(`registerChannelListener (${type})`, () => {

      it('should registered listeners with underlying channel source', async () => {
        let events = 0;
        const stubChannelSource = new StubChannelSource();
        const channelSource = new ResilientChannelSource({ channelSource: stubChannelSource });
        channelSource.registerChannelListener('close', () => events++ );

        const channel = await channelSource[method]();
        channel.emit('close');

        eq(events, 1);
      });
    });

    describe(`getChannel (${type})`, () => {

      it(`should repeatedly attempt to acquire a ${type} channel using the default retry strategy`, async () => {
        const stubChannelSource = new StubChannelSource({ [method]: (count) => {
          if (count < 3) throw new Error('Oh Noes!');
          return type === ChannelType.REGULAR ? new StubChannel() : new StubConfirmChannel();
        }});
        const channelSource = new ResilientChannelSource({ channelSource: stubChannelSource });

        const before = Date.now();
        const channel = await channelSource[method]();
        const after = Date.now();

        ok(channel);

        const duration = after - before;
        ok(duration >= 1050);
        ok(duration <= 1750);
      });

      it(`should repeatedly attempt to acquire a ${type} channel using a custom retry strategy`, async () => {
        const stubChannelSource = new StubChannelSource({ [method]: (count) => {
          if (count < 3) throw new Error('Oh Noes!');
          return type === ChannelType.REGULAR ? new StubChannel() : new StubConfirmChannel();
        }});
        const retryStrategy = () => 100;
        const channelSource = new ResilientChannelSource({ channelSource: stubChannelSource, retryStrategy });

        const before = Date.now();
        const channel = await channelSource[method]();
        const after = Date.now();

        ok(channel);

        const duration = after - before;
        ok(duration >= 300);
        ok(duration <= 400);
      });

      it(`should give up attempting to acquire a ${type} channel when retry stratgey returns a negative`, async () => {
        const stubChannelSource = new StubChannelSource({ [method]: FAIL_FOREVER });
        const retryStrategy = () => -1;
        const channelSource = new ResilientChannelSource({ channelSource: stubChannelSource, retryStrategy });

        await rejects(() => channelSource[method](), /Oh Noes/);
      });
    });

    describe(`close (${type})`, async () => {

      it(`should cancel inflight ${type} retry attempts with a rejection`, async () => {
        const stubChannelSource = new StubChannelSource({ [method]: FAIL_FOREVER });
        const retryStrategy = () => 100;
        const channelSource = new ResilientChannelSource({ channelSource: stubChannelSource, retryStrategy });

        setTimeout(() => channelSource.close(), 200);
        await rejects(() => channelSource[method](), /The channel source is closed/);
      });

      it(`should reject attempts to get a ${type} channel when closed`, async () => {
        const stubChannelSource = new StubChannelSource();
        const channelSource = new ResilientChannelSource({ channelSource: stubChannelSource });

        await channelSource.close();

        await rejects(() => channelSource[method](), /The channel source is closed/);
      });
    });
  });

  describe('close', async () => {
    it('should tolerate repeated closures', async () => {
      const stubChannelSource = new StubChannelSource();
      const channelSource = new ResilientChannelSource({ channelSource: stubChannelSource });
      await channelSource.close();
      await channelSource.close();
    });
  });
});
