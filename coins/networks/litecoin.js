exports.name = 'litecoin'
exports.ticker = 'ltc'

var litecoinFeePerKb = 100000
var litecoinFeePerByte = litecoinFeePerKb / 1024
var litecoinMinFee = litecoinFeePerKb

exports.satPerCoin = 1e8
exports.feePerKb = litecoinFeePerKb
exports.feePerByte = litecoinFeePerByte
exports.maxFeePerByte = 100
exports.minFee = litecoinMinFee
exports.dust = 54600

exports.txVersion = 1

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://insight.litecore.io')
exports.backupExplorers = []

exports.estimateFee = function (tx) {
  let bytes = tx.virtualSize()
  return Math.max(bytes * litecoinFeePerByte, litecoinMinFee)
}

exports.network = require('bitcoinjs-lib').networks.litecoin
