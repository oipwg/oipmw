const coinNetworks = require('../coins/networks')
const util = require('../util')
const isValidAddress = util.validation.isValidAddress
const bitcoin = require('bitcoinjs-lib')
const callbackify = require('callbackify')
const Coin = require('./coin')

function Key (privKey, coins) {
  if (!(this instanceof Key)) {
    console.warn('Non constructor call made to Key.constructor')
    return new Key(...arguments)
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

Key.prototype.addCoin = function (coinName) {
  if (coinNetworks.isSupported(coinName)) {
    if (this.coins[coinName]) {
      return
    }

    this.coins[coinName] = new Coin(coinName, this.privKey)
  }
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

Key.prototype.payTo = callbackify.variadic(function (coinName, address, amount, fee, txComment) {
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

  let amountSat = amount * coin.coinInfo.satPerCoin

  if (coin.balanceSat < amountSat) {
    return Promise.reject(new Error('not enough unspent balance on key'))
  }

  if (!isValidAddress(address, coin.coinInfo.network)) {
    return Promise.reject(new Error('invalid address'))
  }

  let inputs = this.getBestUnspent(coin, amount)

  if (inputs.err !== null) {
    return Promise.reject(inputs)
  }
  let subTotalSat = Math.floor(inputs.subTotal * coin.coinInfo.satPerCoin)

  let tx = new bitcoin.TransactionBuilder(coin.coinInfo.network, coin.coinInfo.maxFeePerByte)
  tx.setVersion(coin.coinInfo.txVersion)

  for (let input of inputs.txo) {
    tx.addInput(input.txid, input.vout)
  }

  tx.addOutput(address, amountSat)

  let calcFee = coin.coinInfo.estimateFee(tx.buildIncomplete(), txComment.length)
  if (fee !== undefined) {
    calcFee = Math.max(calcFee, Math.floor(fee * coin.coinInfo.satPerCoin))
  }
  tx.addOutput(coin.address, subTotalSat - amountSat - calcFee)

  for (let i = 0; i < inputs.txo.length; i++) {
    tx.sign(i, coin.ecKey)
  }

  let rawTx = tx.build().toHex()

  if (txComment !== '') {
    rawTx += bitcoin.bufferutils.varIntBuffer(txComment.length).toString('hex') + Buffer.from(txComment).toString('hex')
  }

  return coin.coinInfo.explorer.pushTX(rawTx)
})

Key.prototype.getBestUnspent = function (coin, amount) {
  let subTotal = 0
  let txo = []

  let utxos = coin.utxo.sort((a, b) => {
    // Sort first by confirmations then amount + to -
    if (a.confirmations < b.confirmations) {
      return -1
    }
    if (a.confirmations > b.confirmations) {
      return 1
    }
    return b.amount - a.amount
  })

  let s = utxos.some((utxo) => {
    subTotal += utxo.amount
    txo.push(utxo)

    if (subTotal > amount) {
      return true
    }
  })

  if (!s) {
    return {err: 'not enough unspent balance'}
  } else {
    return {
      err: null,
      subTotal: subTotal,
      txo: txo
    }
  }
}

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

  return Promise.all(p)
})

Key.prototype.refreshUnspent = callbackify(function () {
  let p = []

  for (let c in this.coins) {
    if (!this.coins.hasOwnProperty(c)) {
      continue
    }
    let coin = this.coins[c]
    let _this = this
    p.push(coin.coinInfo.explorer.getUnspent(coin.address).then((res) => {
      _this.coins[c].utxo = res
      return Promise.resolve({coinName: c, utxo: res})
    }))
  }

  return Promise.all(p)
})

module.exports = Key
