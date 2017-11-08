const bitcoin = require('bitcoinjs-lib')
const coinNetworks = require('../coins/networks')

function Coin (coinName, privKey) {
  if (!(this instanceof Coin)) {
    console.warn('Non constructor call made to Coin.constructor')
    return new Coin(...arguments)
  }

  this.privKey = privKey
  this.coinInfo = coinNetworks.getCoinInfo(coinName)
  this.ecKey = bitcoin.ECPair.fromWIF(this.privKey, coinNetworks.supportedNetworks)

  // get raw private key and correct network type
  if (this.ecKey.network.wif !== this.coinInfo.network.wif) {
    this.ecKey = new bitcoin.ECPair(this.ecKey.d, null, {
      compressed: this.ecKey.compressed,
      network: this.coinInfo.network
    })
  }

  this.address = this.ecKey.getAddress().toString()
  this.balanceSat = 0
  this.transactions = []
  this.utxo = []
  this.stxo = []
}

Coin.prototype.toJSON = function () {
  return {
    stxo: this.stxo
  }
}

module.exports = Coin
