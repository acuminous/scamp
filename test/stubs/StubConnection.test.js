const { strictEqual: eq, rejects } = require('assert');
const { StubConnection } = require('../..');
const { describe, it } = require('zunit');

describe('StubConnection', () => {

  describe('bork', () => {

    it('should emit an error event', (_, done) => {
      const stubConnection = new StubConnection();

      stubConnection.on('error', err => {
        eq(err.message, 'Unexpected close');
        done();
      });

      stubConnection.bork(new Error('Unexpected close'));
    });

    it('should emit a close event', (_, done) => {
      const stubConnection = new StubConnection();

      stubConnection.on('error', () => {});
      stubConnection.on('close', err => {
        eq(err.message, 'Unexpected close');
        done();
      });

      stubConnection.bork(new Error('Unexpected close'));
    });

    it('should emit a close event after the error event', (_, done) => {
      let events = 0;
      const stubConnection = new StubConnection();

      stubConnection.on('error', () => events++);
      stubConnection.on('close', () => {
        events++;
        eq(events, 2);
        done();
      });

      stubConnection.bork(new Error('Unexpected close'));
    });

    it('should reject regular channel requests when borked', async () => {
      const stubConnection = new StubConnection({ error: new Error('Oh Noes') });

      await rejects(() => stubConnection.createChannel(), /IllegalOperationError: Connection closed \(Error: Oh Noes\)/);
    });

    it('should reject confirm channel requests when borked', async () => {
      const stubConnection = new StubConnection({ error: new Error('Oh Noes') });

      await rejects(() => stubConnection.createConfirmChannel(), /IllegalOperationError: Connection closed \(Error: Oh Noes\)/);
    });

    it('should reject close requests when borked', async () => {
      const stubConnection = new StubConnection({ error: new Error('Oh Noes') });

      await rejects(() => stubConnection.createConfirmChannel(), /IllegalOperationError: Connection closed \(Error: Oh Noes\)/);
    });
  });

  describe('close', () => {

    it('should emit an close event', async (_, done) => {
      const stubConnection = new StubConnection();

      stubConnection.on('close', () => done());

      await stubConnection.close();
    });

    it('should reject regular channel requests when closed', async () => {
      const stubConnection = new StubConnection({ closedBy: 'client' });

      await rejects(() => stubConnection.createChannel(), /IllegalOperationError: Connection closed \(by client\)/);
    });

    it('should reject confirm channel requests when closed', async () => {
      const stubConnection = new StubConnection({ closedBy: 'client' });

      await rejects(() => stubConnection.createConfirmChannel(), /IllegalOperationError: Connection closed \(by client\)/);
    });

    it('should reject close requests when closed', async () => {
      const stubConnection = new StubConnection({ closedBy: 'client' });

      await rejects(() => stubConnection.close(), /IllegalOperationError: Connection closed \(by client\)/);
    });
  });

  describe('createChannel', () => {

  });

  describe('createConfirmChannel', () => {

  });
});