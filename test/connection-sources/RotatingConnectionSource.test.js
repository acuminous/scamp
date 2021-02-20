const { strictEqual: eq, rejects } = require('assert');
const { RotatingConnectionSource, StubConnectionSource } = require('../..');

describe('RotatingConnectionSource', () => {

  describe('registerConnectionListener', () => {

    it('should add registered listeners to all underlying connection sources', async() => {
      let events = 0;
      const connectionSources = [
        new StubConnectionSource(),
        new StubConnectionSource(),
        new StubConnectionSource(),
      ];
      const connectionSource = new RotatingConnectionSource({ connectionSources });
      connectionSource.registerConnectionListener('close', () =>  events++);

      await Promise.all(new Array(connectionSources.length).fill().map(async () => {
        const connection = await connectionSource.getConnection();
        await connection.close();
      }));

      eq(events, 3);
    });
  });

  describe('getConnection', () => {

    it('should acquire connections from each source in turn', async () => {
      const connectionSources = [
        new StubConnectionSource({ baseId: '1' }),
        new StubConnectionSource({ baseId: '2' }),
        new StubConnectionSource({ baseId: '3' }),
      ];
      const connectionSource = new RotatingConnectionSource({ connectionSources });
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
      const connectionSource = new RotatingConnectionSource({ connectionSources: [] });
      await connectionSource.close();

      await rejects(() => connectionSource.getConnection(), /The connection source is closed/);
    });

    it('should tolerate repeated closures', async () => {
      const connectionSource = new RotatingConnectionSource({ connectionSources: [] });
      await connectionSource.close();
      await connectionSource.close();
    });
  });
});
