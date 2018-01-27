exports.name = 'florincoin'
exports.ticker = 'flo'

var florincoinFeePerKb = 100000
var florincoinFeePerByte = florincoinFeePerKb / 1024
var florincoinMinFee = florincoinFeePerKb

exports.satPerCoin = 1e8
exports.feePerKb = florincoinFeePerKb
exports.feePerByte = florincoinFeePerByte
exports.maxFeePerByte = 100
exports.minFee = florincoinMinFee
exports.dust = 100000

exports.txVersion = 2

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://florinsight.alexandria.io')
exports.backupExplorers = []

exports.estimateFee = function (tx, extraBytes) {
  let bytes = tx.virtualSize() + (extraBytes || 0)
  return Math.max(bytes * florincoinFeePerByte, florincoinMinFee)
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
