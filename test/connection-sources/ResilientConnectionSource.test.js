const { ok, rejects } = require('assert');
const { describe, it } = require('zunit');
const { EventEmitter } = require('events');
const { ResilientConnectionSource } = require('../..');

describe('ResilientConnectionSource', () => {

  describe('getConnection', () => {

    it('should repeatedly attempt to acquire a connection using the default retry strategy', async () => {
      const connectionSourceStub = new ConnectionSourceStub(3);
      const connectionSource = new ResilientConnectionSource({ connectionSource: connectionSourceStub });

      const before = Date.now();
      const connection = await connectionSource.getConnection();
      const after = Date.now();

      ok(connection);

      const duration = after - before;
      ok(duration >= 1050);
      ok(duration <= 1750);
    });

    it('should repeatedly attempt to acquire a connection using a custom retry strategy', async () => {
      const connectionSourceStub = new ConnectionSourceStub(3);
      const retryStrategy = () => 100;
      const connectionSource = new ResilientConnectionSource({ connectionSource: connectionSourceStub, retryStrategy });

      const before = Date.now();
      const connection = await connectionSource.getConnection();
      const after = Date.now();

      ok(connection);

      const duration = after - before;
      ok(duration >= 300);
      ok(duration <= 400);
    });


    it('should give up attempting to acquire a connection when retry stratgey returns a negative', async () => {
      const connectionSourceStub = new ConnectionSourceStub(3);
      const retryStrategy = () => -1;
      const connectionSource = new ResilientConnectionSource({ connectionSource: connectionSourceStub, retryStrategy });

      await rejects(() => connectionSource.getConnection(), /Oh Noes/);
    });
  });

  describe('close', async () => {

    it('should cancel inflight retry attempts', async () => {
      const connectionSourceStub = new ConnectionSourceStub();
      const retryStrategy = () => 100;
      const connectionSource = new ResilientConnectionSource({ connectionSource: connectionSourceStub, retryStrategy });

      setTimeout(() => connectionSource.close(), 200);
      await rejects(() => connectionSource.getConnection(), /The connection source is closed/);
    });

    it('should reject attempts to get a connection when closed', async () => {
      const connectionSourceStub = new ConnectionSourceStub();
      const connectionSource = new ResilientConnectionSource({ connectionSource: connectionSourceStub });

      await connectionSource.close();

      await rejects(() => connectionSource.getConnection(), /The connection source is closed/);
    });

    it('should tolerate repeated closures', async () => {
      const connectionSourceStub = new ConnectionSourceStub();
      const connectionSource = new ResilientConnectionSource({ connectionSource: connectionSourceStub });
      await connectionSource.close();
      await connectionSource.close();
    });
  });
});

class ConnectionSourceStub {
  constructor(attempts = 100) {
    this.attempts = attempts;
    this.attempt = 0;
  }

  async getConnection() {
    if (this.attempt++ < this.attempts) throw new Error('Oh Noes');
    return new EventEmitter();
  }
}
