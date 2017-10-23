exports.name = 'bitcoin_testnet'
exports.ticker = 'tbtc'

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://test-insight.bitpay.com')
exports.backupExplorers = []

exports.network = require('bitcoinjs-lib').networks.testnet
