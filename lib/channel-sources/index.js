const AmqplibChannelSource = require('./AmqplibChannelSource');
const DedicatedChannelSource = require('./DedicatedChannelSource');
const MultiChannelSource = require('./MultiChannelSource');
const PooledChannelSource = require('./PooledChannelSource');
const ResilientChannelSource = require('./ResilientChannelSource');
const StickyChannelSource = require('./StickyChannelSource');

module.exports = {
  AmqplibChannelSource,
  DedicatedChannelSource,
  MultiChannelSource,
  PooledChannelSource,
  ResilientChannelSource,
  StickyChannelSource,
};