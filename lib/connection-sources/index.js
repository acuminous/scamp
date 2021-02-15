const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const DedicatedConnectionSource = require('./DedicatedConnectionSource');
const HighAvailabiltyConnectionSource = require('./HighAvailablityConnectionSource');
const MultiConnectionSource = require('./MultiConnectionSource');
const PooledConnectionSource = require('./PooledConnectionSource');
const ResilientConnectionSource = require('./ResilientConnectionSource');
const StickyConnectionSource = require('./StickyConnectionSource');

module.exports = {
  AmqplibConnectionSource,
  DedicatedConnectionSource,
  HighAvailabiltyConnectionSource,
  MultiConnectionSource,
  PooledConnectionSource,
  ResilientConnectionSource,
  StickyConnectionSource,
};