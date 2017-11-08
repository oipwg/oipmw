const bitcoinjs = require('bitcoinjs-lib')
const Transaction = bitcoinjs.Transaction
const util = require('../../util')
const prepareCallback = util.prepareCallback
const simplePOST = util.simplePOST
const simpleGET = util.simpleGET

function Insight (url, options) {
  if (!(this instanceof Insight)) {
    console.warn('Non constructor call made to Insight.constructor')
    return new Insight(...arguments)
  }

  this.version = 0
  this.url = url
  this.apiUrl = url + '/api'
  this.satPerCoin = 1e8

  if (Object.isObject(options)) {
    if (options.satPerCoin !== undefined) {
      this.satPerCoin = options.satPerCoin
    }
    if (options.apiPath !== undefined) {
      this.apiUrl = url + options.apiPath
    }
    if (options.apiUrl !== undefined) {
      this.apiUrl = options.apiUrl
    }
  }
}

Insight.prototype.init = function () {
  if (this.version !== 0) {
    return Promise.resolve()
  }

  return simpleGET(this.apiUrl + '/version').then((res) => {
    let ver = res.version
    if (ver.startsWith('0.2')) {
      this.version = 2
    } else if (ver.startsWith('0.4')) {
      this.version = 4
    } else {
      return Promise.reject(new Error('unsupported insight version ' + ver))
    }
  })

}

Insight.prototype.pushTX = function (tx, callback) {
  callback = prepareCallback(callback)

  let hex
  if (tx instanceof Transaction) {
    hex = tx.toHex()
  }

  if (typeof tx === 'string') {
    hex = tx
  }

  return this.init().then(simplePOST(this.apiUrl + '/tx/send', {rawtx: hex}, callback))
    .then((res) => {
      if (this.version === 2) {
        return Promise.resolve({
          txid: res
        })
      }
    })
}

Insight.prototype.getUnspent = function (address, callback) {
  callback = prepareCallback(callback)

  return this.init().then(simpleGET(this.apiUrl + '/addr/' + address + '/utxo', callback))
    .then((res) => {
      if (this.version === 2) {
        let ret = res
        ret.satoshis = Math.floor(ret.amount * this.satPerCoin)
        return Promise.resolve(ret)
      }
    })
}

Insight.prototype.getBalance = function (address, callback) {
  callback = prepareCallback(callback)

  return this.init().then(simpleGET(this.apiUrl + '/addr/' + address, {noTxList: 1}, callback))
}

Insight.prototype.getInfo = function (address, callback) {
  callback = prepareCallback(callback)

  return this.init().then(simpleGET(this.apiUrl + '/addr/' + address, callback))
}

Insight.prototype.getTransactions = function (address, callback) {
  callback = prepareCallback(callback)

  return this.init().then(simpleGET(this.apiUrl + '/addrs/' + address + '/txs', callback))
}

module.exports = Insight
