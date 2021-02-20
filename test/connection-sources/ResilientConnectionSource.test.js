const { strictEqual: eq, ok, rejects } = require('assert');
const { describe, it } = require('zunit');
const { EventEmitter } = require('events');
const { ResilientConnectionSource, StubConnectionSource } = require('../..');
const { StubConnection } = require('../../lib/stubs');

describe('ResilientConnectionSource', () => {

  const FAIL_THREE_TIMES = async (count) => {
    if (count < 3) throw new Error('Oh Noes!');
    return new StubConnection();
  };

  const FAIL_FOREVER = () => {
    throw new Error('Oh Noes!');
  };

  describe('registerConnectionListener', () => {

    it('should add registered listeners to underlying connection source', async() => {
      const stubConnectionSource = new StubConnectionSource();
      const connectionSource = new ResilientConnectionSource({ connectionSource: stubConnectionSource });

      connectionSource.registerConnectionListener('close', () =>  {});

      eq(stubConnectionSource.connectionListeners.length, 1);
      eq(stubConnectionSource.connectionListeners[0].event, 'close');
    });
  });

  describe('getConnection', () => {

    it('should repeatedly attempt to acquire a connection using the default retry strategy', async () => {
      const stubConnectionSource = new StubConnectionSource({ aquire: FAIL_THREE_TIMES });
      const connectionSource = new ResilientConnectionSource({ connectionSource: stubConnectionSource });

      const before = Date.now();
      const connection = await connectionSource.getConnection();
      const after = Date.now();

      ok(connection);

      const duration = after - before;
      ok(duration >= 1050);
      ok(duration <= 1750);
    });

    it('should repeatedly attempt to acquire a connection using a custom retry strategy', async () => {
      const stubConnectionSource = new StubConnectionSource({ aquire: FAIL_THREE_TIMES });
      const retryStrategy = () => 100;
      const connectionSource = new ResilientConnectionSource({ connectionSource: stubConnectionSource, retryStrategy });

      const before = Date.now();
      const connection = await connectionSource.getConnection();
      const after = Date.now();

      ok(connection);

      const duration = after - before;
      ok(duration >= 300);
      ok(duration <= 400);
    });

    it('should give up attempting to acquire a connection when retry stratgey returns a negative', async () => {
      const stubConnectionSource = new StubConnectionSource({ aquire: FAIL_FOREVER });
      const retryStrategy = () => -1;
      const connectionSource = new ResilientConnectionSource({ connectionSource: stubConnectionSource, retryStrategy });

      await rejects(() => connectionSource.getConnection(), /Oh Noes/);
    });
  });

  describe('close', async () => {

    it('should cancel inflight retry attempts', async () => {
      const stubConnectionSource = new StubConnectionSource({ aquire: FAIL_FOREVER });

      const retryStrategy = () => 100;
      const connectionSource = new ResilientConnectionSource({ connectionSource: stubConnectionSource, retryStrategy });

      setTimeout(() => connectionSource.close(), 200);
      await rejects(() => connectionSource.getConnection(), /The connection source is closed/);
    });

    it('should reject attempts to get a connection when closed', async () => {
      const stubConnectionSource = new XStubConnectionSource();
      const connectionSource = new ResilientConnectionSource({ connectionSource: stubConnectionSource });

      await connectionSource.close();

      await rejects(() => connectionSource.getConnection(), /The connection source is closed/);
    });

    it('should tolerate repeated closures', async () => {
      const stubConnectionSource = new StubConnectionSource({ aquire: FAIL_FOREVER });
      const connectionSource = new ResilientConnectionSource({ connectionSource: stubConnectionSource });
      await connectionSource.close();
      await connectionSource.close();
    });
  });
});

class XStubConnectionSource {
  constructor(attempts = 100) {
    this.attempts = attempts;
    this.attempt = 0;
    this.connectionListeners = [];
  }

  registerConnectionListener(event, listener) {
    this.connectionListeners.push({ event, listener });
  }

  async getConnection() {
    if (this.attempt++ < this.attempts) throw new Error('Oh Noes');
    return new EventEmitter();
  }
}
