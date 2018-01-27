exports.name = 'bitcoin_testnet'
exports.ticker = 'tbtc'

var tbitcoinFeePerKb = 100000
var tbitcoinFeePerByte = tbitcoinFeePerKb / 1024
var tbitcoinMinFee = tbitcoinFeePerKb

exports.satPerCoin = 1e8
exports.feePerKb = tbitcoinFeePerKb
exports.feePerByte = tbitcoinFeePerByte
exports.maxFeePerByte = 100
exports.minFee = tbitcoinMinFee
exports.dust = 546

exports.txVersion = 1

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://test-insight.bitpay.com')
exports.backupExplorers = []

exports.estimateFee = function (tx) {
  let bytes = tx.virtualSize()
  return Math.max(bytes * tbitcoinFeePerByte, tbitcoinMinFee)
}

exports.network = require('bitcoinjs-lib').networks.testnet
