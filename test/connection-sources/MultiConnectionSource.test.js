const { strictEqual: eq } = require('assert');
const { describe, it } = require('zunit');
const { EventEmitter } = require('events');
const { MultiConnectionSource } = require('../..');

describe('MultiConnectionSource', () => {

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

class ConnectionSourceStub {
  constructor(id) {
    this.id = id;
  }

  async getConnection() {
    return Object.assign(new EventEmitter(), { id: this.id });
  }
}