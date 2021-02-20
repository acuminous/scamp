const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const HighAvailabiltyConnectionSource = require('./HighAvailablityConnectionSource');
const RotatingConnectionSource = require('./RotatingConnectionSource');
const PersistentConnectionSource = require('./ReliableConnectionSource');
const RecoveringConnectionSource = require('./RecoveringConnectionSource');
const CachingConnectionSource = require('./CachingConnectionSource');

module.exports = {
  AmqplibConnectionSource,
  HighAvailabiltyConnectionSource,
  RotatingConnectionSource,
  PersistentConnectionSource,
  RecoveringConnectionSource,
  CachingConnectionSource,
};