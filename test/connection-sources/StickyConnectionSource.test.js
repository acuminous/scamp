const { strictEqual: eq, rejects } = require('assert');
const { describe, it } = require('zunit');
const { EventEmitter } = require('events');
const { StickyConnectionSource } = require('../..');
const ScampEvents = require('../../lib/ScampEvents');

describe('StickyConnectionSource', () => {

  describe('getConnection', () => {
    it('should acquire a new connection when the cache is empty', async () => {
      const stubConnectionSource = new ConnectionSourceStub();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });

      const connection = await connectionSource.getConnection();

      eq(connection.x_scamp.id, 1);
    });

    it('should reuse the existing connection when the cache is primed', async () => {
      const stubConnectionSource = new ConnectionSourceStub();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });

      const connection1 = await connectionSource.getConnection();
      const connection2 = await connectionSource.getConnection();

      eq(connection1.x_scamp.id, 1);
      eq(connection2.x_scamp.id, 1);
    });

    it('should acquire a new connection after loss', async () => {
      const stubConnectionSource = new ConnectionSourceStub();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });

      const connection1 = await connectionSource.getConnection();
      connection1.emit(ScampEvents.LOST);

      const connection2 = await connectionSource.getConnection();

      eq(connection1.x_scamp.id, 1);
      eq(connection2.x_scamp.id, 2);
    });

    it('should synchronise new connection acquisition', async () => {
      const stubConnectionSource = new ConnectionSourceStub();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });

      const connection1 = await connectionSource.getConnection();
      eq(connection1.x_scamp.id, 1);
      connection1.emit(ScampEvents.LOST);

      const connections = await Promise.all(new Array(100).fill().map(() => connectionSource.getConnection()));
      connections.forEach(connection2 => {
        eq(connection2.x_scamp.id, 2);
      });
    });
  });

  describe('close', async () => {

    it('should close cached connection', async () => {
      const stubConnectionSource = new ConnectionSourceStub();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });

      const connection = await connectionSource.getConnection();

      await connectionSource.close();

      eq(connection.x_scamp.open, false);
    });

    it('should reject attempts to get a connection when closed', async () => {
      const stubConnectionSource = new ConnectionSourceStub();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });
      await connectionSource.close();

      await rejects(() => connectionSource.getConnection(), /The connection source is closed/);
    });

    it('should tolerate repeated closures', async () => {
      const stubConnectionSource = new ConnectionSourceStub();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });
      await connectionSource.close();
      await connectionSource.close();
    });
  });
});

class ConnectionSourceStub {
  constructor() {
    this.id = 1;
  }

  async getConnection() {
    const x_scamp = { id: this.id++, type: 'confirm', open: true };
    return Object.assign(new EventEmitter(), { x_scamp }, { close: async () => x_scamp.open = false });
  }
}