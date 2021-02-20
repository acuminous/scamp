const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const HighAvailabiltyConnectionSource = require('./HighAvailablityConnectionSource');
const RotatingConnectionSource = require('./RotatingConnectionSource');
const ReliableConnectionSource = require('./ReliableConnectionSource');
const RecoveringConnectionSource = require('./RecoveringConnectionSource');
const CachingConnectionSource = require('./CachingConnectionSource');

module.exports = {
  AmqplibConnectionSource,
  HighAvailabiltyConnectionSource,
  RotatingConnectionSource,
  ReliableConnectionSource,
  RecoveringConnectionSource,
  CachingConnectionSource,
};