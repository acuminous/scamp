const { strictEqual: eq, rejects } = require('assert');
const { describe, it } = require('zunit');
const { MultiConnectionSource, StubConnectionSource } = require('../..');

describe('MultiConnectionSource', () => {

  describe('registerConnectionListener', () => {

    it('should add registered listeners to all underlying connection sources', async() => {
      const connectionSources = [
        new StubConnectionSource(),
        new StubConnectionSource(),
        new StubConnectionSource(),
      ];
      const connectionSource = new MultiConnectionSource({ connectionSources });

      connectionSource.registerConnectionListener('close', () =>  {});

      connectionSources.forEach(stubConnectionSource => {
        eq(stubConnectionSource.connectionListeners.length, 1);
        eq(stubConnectionSource.connectionListeners[0].event, 'close');
      });
    });
  });

  describe('getConnection', () => {

    it('should acquire connections from each source in turn', async () => {
      const connectionSources = [
        new StubConnectionSource({ id: 1 }),
        new StubConnectionSource({ id: 2 }),
        new StubConnectionSource({ id: 3 }),
      ];
      const connectionSource = new MultiConnectionSource({ connectionSources });
      const connection1 = await connectionSource.getConnection();
      const connection2 = await connectionSource.getConnection();
      const connection3 = await connectionSource.getConnection();
      const connection4 = await connectionSource.getConnection();

      eq(connection1.x_scamp.id, '1#1');
      eq(connection2.x_scamp.id, '2#1');
      eq(connection3.x_scamp.id, '3#1');
      eq(connection4.x_scamp.id, '1#2');
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
