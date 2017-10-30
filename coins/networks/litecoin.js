exports.name = 'litecoin'
exports.ticker = 'ltc'

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://insight.litecore.io/')
exports.backupExplorers = []

exports.estimateFee = function (tx) {
  return 0.001
}

exports.network = require('bitcoinjs-lib').networks.litecoin
