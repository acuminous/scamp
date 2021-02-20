const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const HighAvailabiltyConnectionSource = require('./HighAvailablityConnectionSource');
const RotatingConnectionSource = require('./RotatingConnectionSource');
const PersistentConnectionSource = require('./PersistentConnectionSource');
const PooledConnectionSource = require('./PooledConnectionSource');
const ResilientConnectionSource = require('./ResilientConnectionSource');
const StickyConnectionSource = require('./StickyConnectionSource');

module.exports = {
  AmqplibConnectionSource,
  HighAvailabiltyConnectionSource,
  RotatingConnectionSource,
  PersistentConnectionSource,
  PooledConnectionSource,
  ResilientConnectionSource,
  StickyConnectionSource,
};