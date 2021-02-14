const { strictEqual: eq } = require('assert');
const { describe, it } = require('zunit');
const { EventEmitter } = require('events');
const { CachingConnectionSource } = require('../..');
const ScampEvents = require('../../lib/ScampEvents');

describe('CachingConnectionSource', () => {

  it('should acquire a new connection when the cache is empty', async () => {
    const stubConnectionSource = new ConnectionSourceStub();
    const connectionSource = new CachingConnectionSource({ connectionSource: stubConnectionSource });

    const connection = await connectionSource.getConnection();

    eq(connection.x_scamp.id, 1);
  });

  it('should reuse the existing connection when the cache is primed', async () => {
    const stubConnectionSource = new ConnectionSourceStub();
    const connectionSource = new CachingConnectionSource({ connectionSource: stubConnectionSource });

    const connection1 = await connectionSource.getConnection();
    const connection2 = await connectionSource.getConnection();

    eq(connection1.x_scamp.id, 1);
    eq(connection2.x_scamp.id, 1);
  });

  it('should acquire a new connection after loss', async () => {
    const stubConnectionSource = new ConnectionSourceStub();
    const connectionSource = new CachingConnectionSource({ connectionSource: stubConnectionSource });

    const connection1 = await connectionSource.getConnection();
    connection1.emit(ScampEvents.LOST);

    const connection2 = await connectionSource.getConnection();

    eq(connection1.x_scamp.id, 1);
    eq(connection2.x_scamp.id, 2);
  });

  it('should synchronise new connection acquisition', async () => {
    const stubConnectionSource = new ConnectionSourceStub();
    const connectionSource = new CachingConnectionSource({ connectionSource: stubConnectionSource });

    const connection1 = await connectionSource.getConnection();
    eq(connection1.x_scamp.id, 1);
    connection1.emit(ScampEvents.LOST);

    const connections = await Promise.all(new Array(100).fill().map(() => connectionSource.getConnection()));
    connections.forEach(connection2 => {
      eq(connection2.x_scamp.id, 2);
    });
  });

});

class ConnectionSourceStub {
  constructor() {
    this.id = 1;
  }

  async getConnection() {
    return Object.assign(new EventEmitter(), { x_scamp: { id: this.id++ } });
  }
}