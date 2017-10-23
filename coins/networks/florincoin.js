exports.name = 'florincoin'
exports.ticker = 'flo'

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://florinsight.alexandria.io')
exports.backupExplorers = []

exports.network = {
  magicPrefix: '\x1bFlorincoin Signed Message:\n',
  pubKeyHash: 35,
  scriptHash: 8,
  wif: 163
}
