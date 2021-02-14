const { strictEqual: eq, rejects } = require('assert');
const { describe, it } = require('zunit');
const { EventEmitter } = require('events');
const { MultiConnectionSource } = require('../..');

describe('MultiConnectionSource', () => {

  describe('getConnection', () => {

    it('should acquire connections from each source in turn', async () => {
      const connectionSources = [
        new ConnectionSourceStub(1),
        new ConnectionSourceStub(2),
        new ConnectionSourceStub(3),
      ];
      const connectionSource = new MultiConnectionSource({ connectionSources });
      const connection1 = await connectionSource.getConnection();
      const connection2 = await connectionSource.getConnection();
      const connection3 = await connectionSource.getConnection();
      const connection4 = await connectionSource.getConnection();

      eq(connection1.id, 1);
      eq(connection2.id, 2);
      eq(connection3.id, 3);
      eq(connection4.id, 1);
    });
  });

  describe('close', async () => {

    it('should reject attempts to get a connection when closed', async () => {
      const connectionSource = new MultiConnectionSource({ connectionSources: [] });
      await connectionSource.close();

      await rejects(() => connectionSource.getConnection(), /The connection source is closed/);
    });

    it('should tolerate repeated closures', async () => {
      const connectionSource = new MultiConnectionSource({ connectionSources: [] });
      await connectionSource.close();
      await connectionSource.close();
    });
  });
});

class ConnectionSourceStub {
  constructor(id) {
    this.id = id;
  }

  async getConnection() {
    return Object.assign(new EventEmitter(), { id: this.id });
  }
}