const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const HighAvailabiltyConnectionSource = require('./HighAvailablityConnectionSource');
const MultiConnectionSource = require('./MultiConnectionSource');
const PersistentConnectionSource = require('./PersistentConnectionSource');
const PooledConnectionSource = require('./PooledConnectionSource');
const ResilientConnectionSource = require('./ResilientConnectionSource');
const StickyConnectionSource = require('./StickyConnectionSource');

module.exports = {
  AmqplibConnectionSource,
  HighAvailabiltyConnectionSource,
  MultiConnectionSource,
  PersistentConnectionSource,
  PooledConnectionSource,
  ResilientConnectionSource,
  StickyConnectionSource,
};