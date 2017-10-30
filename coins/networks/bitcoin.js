exports.name = 'bitcoin'
exports.ticker = 'btc'

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://insight.bitpay.com')
exports.backupExplorers = [
  new explorers.Insight('https://www.localbitcoinschain.com'),
  new explorers.Insight('https://search.bitaccess.co'),
  new explorers.Insight('https://www.localbitcoinschain.com')
]

exports.estimateFee = function(tx) {
  return 0.001
}

exports.network = require('bitcoinjs-lib').networks.bitcoin
