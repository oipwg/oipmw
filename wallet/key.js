const coinNetworks = require('../coins/networks/index')

function Key (privKey, coins) {
  if (!(this instanceof Key)) {
    console.warn('Non constructor call made to Key.constructor')
    return new Key(...arguments)
  }

  this.privKey = privKey
  this.networks = []
  this.balances = []

  if (Array.isArray(coins)) {
    if (coins.length > 0) {
      coins.forEach((coin) => {
        this.addCoin(coin)
      })
    } else {
      this.addCoin('florincoin')
    }
  } else if (typeof coins === 'string') {
    this.addCoin(coins)
  } else {
    this.addCoin('florincoin')
  }
}

Key.prototype.addCoin = function (coinNanme) {
  if (coinNetworks.isSupported(coinNanme)) {
    this.networks.push(coinNetworks.getNetwork(coinNanme))
  }
}

module.exports = Key
