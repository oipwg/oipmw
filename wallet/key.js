const coinNetworks = require('../coins/networks')
const callbackify = require('callbackify')
const Coin = require('./coin')

function Key (privKey, coins) {
  if (!(this instanceof Key)) {
    console.warn('Non constructor call made to Key.constructor')
    return new Key(...arguments)
  }

  if (privKey instanceof Object && coins === undefined) {
    return this.fromDK(privKey)
  }

  this.privKey = privKey
  this.coins = {}

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

Key.prototype.fromDK = function (dk) {
  this.privKey = dk.privKey
  this.coins = {}

  for (let c in dk.coins) {
    if (dk.coins.hasOwnProperty(c)) {
      c = dk.coins[c]
      this.coins[c.coinName] = new Coin(c.coinName, c.privKey, c.stxo)
    }
  }
}

Key.prototype.addCoin = function (coinName) {
  if (coinNetworks.isSupported(coinName)) {
    if (this.coins[coinName]) {
      return
    }

    this.coins[coinName] = new Coin(coinName, this.privKey)
  }
}

Key.prototype.hasCoin = function (coinName) {
  return this.coins[coinName] !== undefined
}

Key.prototype.getAddress = function (coinName) {
  return this.coins[coinName].address
}

Key.prototype.getBalance = function (coinName) {
  return this.coins[coinName].balanceSat / this.coins[coinName].coinInfo.satPerCoin
}

Key.prototype.getBalanceSat = function (coinName) {
  return this.coins[coinName].balanceSat
}

Key.prototype.getTransactions = function (coinName) {
  return this.coins[coinName].transactions
}

Key.prototype.getUTXO = function (coinName) {
  return this.coins[coinName].utxo
}

Key.prototype.getNameFromAddress = function (addr) {
  for (let c in this.coins) {
    if (this.coins.hasOwnProperty(c)) {
      if (c === addr || this.coins[c].address === addr) {
        return c
      }
    }
  }
  return ''
}

Key.prototype.containsAddress = function (addr) {
  return this.getNameFromAddress(addr) !== ''
}

Key.prototype.signMessage = function (addr, message) {
  let name = this.getNameFromAddress(addr)
  if (name !== '') {
    return this.coins[name].signMessage(message)
  }
}

Key.prototype.verifyMessage = function (addr, message, signature) {
  let name = this.getNameFromAddress(addr)
  if (name !== '') {
    return this.coins[name].verifyMessage(message, signature)
  }
}

Key.prototype.payTo = callbackify.variadic(function (coinName, address, amount, fee, txComment) {
  let outputs = {}
  outputs[address] = amount
  return this.payToMulti(coinName, outputs, fee, txComment)
})

Key.prototype.payToMulti = callbackify.variadic(function (coinName, outputs, fee, txComment) {
  if (typeof fee === 'string') {
    txComment = fee
    fee = undefined
  }

  if (coinName === 'florincoin') {
    txComment = txComment || ''
  } else {
    txComment = ''
  }

  let coin = this.coins[coinName]

  if (!coin) {
    return Promise.reject(new Error('coin doesn\'t exist'))
  }

  return coin.payTo(coinName, outputs, fee, txComment)
})

Key.prototype.refreshBalance = callbackify(function () {
  let p = []

  for (let c in this.coins) {
    if (!this.coins.hasOwnProperty(c)) {
      continue
    }
    let coin = this.coins[c]
    p.push(coin.coinInfo.explorer.getBalance(coin.address).then((res) => {
      this.coins[c].balanceSat = res.balanceSat
      return Promise.resolve({coinName: c, res: res})
    }))
  }

  return Promise.allSettled(p)
})

Key.prototype.refreshUnspent = callbackify(function () {
  let p = []

  for (let c in this.coins) {
    if (!this.coins.hasOwnProperty(c)) {
      continue
    }
    let coin = this.coins[c]
    p.push(coin.coinInfo.explorer.getUnspent(coin.address).then((res) => {
      this.coins[c].utxo = res
      coin.mergeTxo()
      return Promise.resolve({coinName: c, utxo: coin.utxo})
    }))
  }

  return Promise.allSettled(p)
})

if (!Promise.allSettled) {
  Promise.allSettled = function (promises) {
    return Promise.all(promises.map(p => Promise.resolve(p).then(v => ({
      state: 'fulfilled',
      value: v
    }), r => ({
      state: 'rejected',
      reason: r
    }))))
  }
}

module.exports = Key
