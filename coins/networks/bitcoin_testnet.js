exports.name = 'bitcoin_testnet'
exports.ticker = 'tbtc'

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://test-insight.bitpay.com')
exports.backupExplorers = []

exports.estimateFee = function(tx) {
  return 0.001
}

exports.network = require('bitcoinjs-lib').networks.testnet
