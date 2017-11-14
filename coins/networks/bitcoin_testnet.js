exports.name = 'bitcoin_testnet'
exports.ticker = 'tbtc'

exports.satPerCoin = 1e8
exports.feePerKb = /* 0.00 */ 100000
exports.feePerByte = this.feePerKb / 1024
exports.maxFeePerByte = 100
exports.minFee = this.feePerKb
exports.dust = 546

exports.txVersion = 1

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://test-insight.bitpay.com')
exports.backupExplorers = []

exports.estimateFee = function (tx) {
  let bytes = tx.virtualSize()
  return Math.max(bytes * this.feePerByte, this.minFee)
}

exports.network = require('bitcoinjs-lib').networks.testnet
