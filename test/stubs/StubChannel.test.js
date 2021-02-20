const { strictEqual: eq, rejects } = require('assert');
const { StubChannel } = require('../..');

describe('StubChannel', () => {

  describe('bork', () => {

    it('should emit an error event', (_, done) => {
      const stubChannel = new StubChannel();

      stubChannel.on('error', err => {
        eq(err.message, 'Unexpected close');
        done();
      });


      stubChannel.bork(new Error('Unexpected close'));
    });

    it('should emit a close event', (_, done) => {
      const stubChannel = new StubChannel();

      stubChannel.on('error', () => {});
      stubChannel.on('close', () => {
        done();
      });

      stubChannel.bork(new Error('Unexpected close'));
    });

    it('should emit a close event after the error event', (_, done) => {
      let events = 0;
      const stubChannel = new StubChannel();

      stubChannel.on('error', () => events++);
      stubChannel.on('close', () => {
        events++;
        eq(events, 2);
        done();
      });

      stubChannel.bork(new Error('Unexpected close'));
    });

    it('should reject close requests when borked', async () => {
      const stubChannel = new StubChannel({ error: new Error('Oh Noes') });

      await rejects(() => stubChannel.close(), /IllegalOperationError: Channel closed/);
    });
  });

  describe('close', () => {

    it('should emit an close event', async (_, done) => {
      const stubChannel = new StubChannel();

      stubChannel.on('close', () => done());

      await stubChannel.close();
    });

    it('should reject close requests when closed', async () => {
      const stubChannel = new StubChannel({ closed: true });

      await rejects(() => stubChannel.close(), /IllegalOperationError: Channel closed/);
    });
  });
});