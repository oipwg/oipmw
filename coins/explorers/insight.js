const bitcoinjs = require('bitcoinjs-lib')
const callbackify = require('callbackify')
const Transaction = bitcoinjs.Transaction
const util = require('../../util')
const simplePOST = util.simplePOST
const simpleGET = util.simpleGET

function Insight (url, options) {
  if (!(this instanceof Insight)) {
    console.warn('Non constructor call made to Insight.constructor')
    return new Insight(...arguments)
  }

  this.version = 0
  this.url = url
  this.apiUrl = this.url + '/api'
  this.satPerCoin = 1e8

  if (options) {
    if (options.satPerCoin !== undefined) {
      this.satPerCoin = options.satPerCoin
    }
    if (options.apiPath !== undefined) {
      this.apiUrl = this.url + options.apiPath
    }
    if (options.apiUrl !== undefined) {
      this.apiUrl = options.apiUrl
    }
  }
}

Insight.prototype.init = callbackify(function () {
  if (this.version !== 0) {
    return Promise.resolve()
  }

  return simpleGET(this.apiUrl + '/version').then((res) => {
    let ver = res.version
    if (ver.startsWith('0.2')) {
      this.version = 2
    } else if (ver.startsWith('0.4')) {
      this.version = 4
    } else if (ver.startsWith('5.0')) {
      this.version = 5
    } else {
      return Promise.reject(new Error('unsupported insight version ' + ver))
    }
  })
})

Insight.prototype.pushTX = callbackify(function (tx) {
  let hex
  if (tx instanceof Transaction) {
    hex = tx.toHex()
  }

  if (typeof tx === 'string') {
    hex = tx
  }

  return this.init()
    .then(() => simplePOST(this.apiUrl + '/tx/send', {rawtx: hex}))
    .then((res) => {
      if (this.version === 2) {
        // v2 APIs return the txid directly so wrap it with an object
        // errors have an error code in parenthesis at the end
        // error codes are not wrapped in an object rather returned bare
        // ToDo: promise.reject if it's an error
        if (res instanceof Object) {
          return res
        } else if (res.indexOf('(') === -1) {
          return Promise.resolve({
            txid: res
          })
        } else {
          return res
        }
      }
    })
})

Insight.prototype.getUnspent = callbackify(function (address) {
  return this.init()
    .then(() => simpleGET(this.apiUrl + '/addr/' + address + '/utxo'))
    .then((res) => {
      let ret = res
      if (this.version === 2) {
        // v2 APIs don't have a satoshis field, so calculate it
        for (let i = 0; i < ret.length; i++) {
          ret[i].satoshis = Math.floor(ret[i].amount * this.satPerCoin)
        }
      }
      return Promise.resolve(ret)
    })
})

Insight.prototype.getBalance = callbackify(function (address) {
  return this.init()
    .then(() => simpleGET(this.apiUrl + '/addr/' + address, {noTxList: 1}))
})

Insight.prototype.getInfo = callbackify(function (address) {
  return this.init()
    .then(() => simpleGET(this.apiUrl + '/addr/' + address))
})

Insight.prototype.getTransactions = callbackify(function (address, page) {
  page = page || 0
  return this.init()
    .then(() => simpleGET(this.apiUrl + '/txs?address=' + address + '&pageNum=' + page))
})

module.exports = Insight
