const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const HighAvailabiltyConnectionSource = require('./HighAvailablityConnectionSource');
const MultiConnectionSource = require('./MultiConnectionSource');
const ResilientConnectionSource = require('./ResilientConnectionSource');
const StickyConnectionSource = require('./StickyConnectionSource');

module.exports = {
  AmqplibConnectionSource,
  HighAvailabiltyConnectionSource,
  MultiConnectionSource,
  ResilientConnectionSource,
  StickyConnectionSource,
};