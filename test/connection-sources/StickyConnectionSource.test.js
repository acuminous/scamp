const { strictEqual: eq, notStrictEqual: neq, rejects, ok } = require('assert');
const { StickyConnectionSource, StubConnectionSource, ScampEvent } = require('../..');

describe('StickyConnectionSource', () => {

  describe('registerConnectionListener', () => {

    it('should add registered listeners to underlying connection source', async() => {
      let events = 0;
      const stubConnectionSource = new StubConnectionSource();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });
      connectionSource.registerConnectionListener('close', () =>  events++);

      const connection = await connectionSource.getConnection();
      connection.close();

      eq(events, 1);
    });
  });

  describe('getConnection', () => {

    it('should acquire a new connection when the cache is empty', async () => {
      const stubConnectionSource = new StubConnectionSource();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });

      const connection = await connectionSource.getConnection();

      ok(connection);
    });

    it('should reuse the existing connection when the cache is primed', async () => {
      const stubConnectionSource = new StubConnectionSource();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });

      const connection1 = await connectionSource.getConnection();
      const connection2 = await connectionSource.getConnection();

      eq(connection1, connection2);
    });

    it('should acquire a new connection after loss', async () => {
      const stubConnectionSource = new StubConnectionSource();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });

      const connection1 = await connectionSource.getConnection();
      connection1.emit(ScampEvent.LOST);

      const connection2 = await connectionSource.getConnection();

      ok(connection1);
      ok(connection2);

      neq(connection1, connection2);
    });

    it('should synchronise new connection acquisition', async () => {
      const stubConnectionSource = new StubConnectionSource();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });

      const connections = await Promise.all(new Array(100).fill().map(() => connectionSource.getConnection()));
      connections.reduce((c1, c2) => {
        eq(c1, c2);
        return c1;
      });
    });
  });

  describe('close', async () => {

    it('should close cached connection', async () => {
      const stubConnectionSource = new StubConnectionSource();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });

      const connection = await connectionSource.getConnection();

      await connectionSource.close();

      eq(connection.closed, true);
    });

    it('should reject attempts to get a connection when closed', async () => {
      const stubConnectionSource = new StubConnectionSource();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });
      await connectionSource.close();

      await rejects(() => connectionSource.getConnection(), /The connection source is closed/);
    });

    it('should tolerate repeated closures', async () => {
      const stubConnectionSource = new StubConnectionSource();
      const connectionSource = new StickyConnectionSource({ connectionSource: stubConnectionSource });
      await connectionSource.close();
      await connectionSource.close();
    });
  });
});
