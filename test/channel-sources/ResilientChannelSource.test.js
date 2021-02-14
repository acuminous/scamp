const { ok, rejects } = require('assert');
const { describe, it } = require('zunit');
const { EventEmitter } = require('events');
const { ResilientChannelSource } = require('../..');

describe('ResilientChannelSource', () => {

  [{ type: 'regular', method: 'getChannel' }, { type: 'confirm', method: 'getConfirmChannel' }].forEach(({ type, method }) => {

    describe(`getChannel (${type})`, () => {

      it(`should repeatedly attempt to acquire a ${type} channel using the default retry strategy`, async () => {
        const channelSourceStub = new ChannelSourceStub(3);
        const channelSource = new ResilientChannelSource({ channelSource: channelSourceStub });

        const before = Date.now();
        const channel = await channelSource[method]();
        const after = Date.now();

        ok(channel);

        const duration = after - before;
        ok(duration >= 1050);
        ok(duration <= 1750);
      });

      it(`should repeatedly attempt to acquire a ${type} channel using a custom retry strategy`, async () => {
        const channelSourceStub = new ChannelSourceStub(3);
        const retryStrategy = () => 100;
        const channelSource = new ResilientChannelSource({ channelSource: channelSourceStub, retryStrategy });

        const before = Date.now();
        const channel = await channelSource[method]();
        const after = Date.now();

        ok(channel);

        const duration = after - before;
        ok(duration >= 300);
        ok(duration <= 400);
      });

      it(`should give up attempting to acquire a ${type} channel when retry stratgey returns a negative`, async () => {
        const channelSourceStub = new ChannelSourceStub(3);
        const retryStrategy = () => -1;
        const channelSource = new ResilientChannelSource({ channelSource: channelSourceStub, retryStrategy });

        await rejects(() => channelSource[method](), /Oh Noes/);
      });
    });
  });

  describe('close', async () => {

    it('should cancel inflight retry attempts', async () => {
      const channelSourceStub = new ChannelSourceStub();
      const retryStrategy = () => 100;
      const channelSource = new ResilientChannelSource({ channelSource: channelSourceStub, retryStrategy });

      setTimeout(() => channelSource.close(), 200);
      await rejects(() => channelSource.getChannel(), /The channel source is closed/);
    });

    it('should reject attempts to get a channel when closed', async () => {
      const channelSourceStub = new ChannelSourceStub();
      const channelSource = new ResilientChannelSource({ channelSource: channelSourceStub });

      await channelSource.close();

      await rejects(() => channelSource.getChannel(), /The channel source is closed/);
    });

    it('should tolerate repeated closures', async () => {
      const channelSourceStub = new ChannelSourceStub();
      const channelSource = new ResilientChannelSource({ channelSource: channelSourceStub });
      await channelSource.close();
      await channelSource.close();
    });
  });
});

class ChannelSourceStub {
  constructor(attempts = 100) {
    this.attempts = attempts;
    this.attempt = 0;
  }

  async getChannel() {
    if (this.attempt++ < this.attempts) throw new Error('Oh Noes');
    return new EventEmitter();
  }

  async getConfirmChannel() {
    if (this.attempt++ < this.attempts) throw new Error('Oh Noes');
    return new EventEmitter();
  }

}
