const floNetwork = require('../coins/florincoin')

function Key (privKey) {
  if (!(this instanceof Key)) {
    console.warn('Non constructor call made to Wallet.constructor')
    return new Key(...arguments)
  }

  this.privKey = privKey
  this.addCoin(floNetwork)
}

Key.prototype.addCoin = function (coinNetwork) {

}

module.exports = Key
