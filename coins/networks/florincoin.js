exports.name = 'florincoin'
exports.ticker = 'flo'

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://florinsight.alexandria.io')
exports.backupExplorers = []

exports.estimateFee = function(tx) {
  return 0.001
}

exports.network = {
  bip32: {
    // ToDo: Configure Florincoin BIP32 settings for HD Wallets
    public: 0x00,
    private: 0x00
  },
  messagePrefix: '\x1bFlorincoin Signed Message:\n',
  pubKeyHash: 35,
  scriptHash: 8,
  wif: 163
}
