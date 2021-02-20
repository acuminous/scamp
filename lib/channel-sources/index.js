const AmqplibChannelSource = require('./AmqplibChannelSource');
const ReliableChannelSource = require('./ReliableChannelSource');
const RotatingChannelSource = require('./RotatingChannelSource');
const PooledChannelSource = require('./PooledChannelSource');
const RecoveringChannelSource = require('./RecoveringChannelSource');
const CachingChannelSource = require('./CachingChannelSource');

module.exports = {
  AmqplibChannelSource,
  ReliableChannelSource,
  RotatingChannelSource,
  PooledChannelSource,
  RecoveringChannelSource,
  CachingChannelSource,
};