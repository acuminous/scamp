const AmqplibConnectionSource = require('./AmqplibConnectionSource');
const HighlyAvailableConnectionSource = require('./HighlyAvailableConnectionSource');
const MultiConnectionSource = require('./MultiConnectionSource');
const ResilientConnectionSource = require('./ResilientConnectionSource');
const StickyConnectionSource = require('./StickyConnectionSource');

module.exports = {
  AmqplibConnectionSource,
  HighlyAvailableConnectionSource,
  MultiConnectionSource,
  ResilientConnectionSource,
  StickyConnectionSource,
};