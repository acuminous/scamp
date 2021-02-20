const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const HighAvailabiltyConnectionSource = require('./HighAvailablityConnectionSource');
const RotatingConnectionSource = require('./RotatingConnectionSource');
const PersistentConnectionSource = require('./ReliableConnectionSource');
const PooledConnectionSource = require('./PooledConnectionSource');
const RecoveringConnectionSource = require('./RecoveringConnectionSource');
const CachingConnectionSource = require('./CachingConnectionSource');

module.exports = {
  AmqplibConnectionSource,
  HighAvailabiltyConnectionSource,
  RotatingConnectionSource,
  PersistentConnectionSource,
  PooledConnectionSource,
  RecoveringConnectionSource,
  CachingConnectionSource,
};