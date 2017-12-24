exports.name = 'bitcoin'
exports.ticker = 'btc'

var bitcoinFeePerKb = 100000
var bitcoinFeePerByte = bitcoinFeePerKb / 1024
var bitcoinMinFee = bitcoinFeePerKb

exports.satPerCoin = 1e8
exports.feePerKb = bitcoinFeePerKb
exports.feePerByte = bitcoinFeePerByte
exports.maxFeePerByte = 100
exports.minFee = bitcoinMinFee
exports.dust = 546

exports.txVersion = 1

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://insight.bitpay.com')
exports.backupExplorers = [
  // new explorers.Insight('https://www.localbitcoinschain.com'),
  // new explorers.Insight('https://search.bitaccess.co'),
  // new explorers.Insight('https://www.localbitcoinschain.com')
]

exports.estimateFee = function (tx) {
  let bytes = tx.virtualSize()
  return Math.max(bytes * bitcoinFeePerByte, bitcoinFeePerKb)
}

exports.network = require('bitcoinjs-lib').networks.bitcoin
