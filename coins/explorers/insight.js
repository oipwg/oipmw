const bitcoinjs = require('bitcoinjs-lib')
const Transaction = bitcoinjs.Transaction
const util = require('../../util')
const prepareCallback = util.prepareCallback
const simplePOST = util.simplePOST
const simpleGET = util.simpleGET

function Insight (url) {
  if (!(this instanceof Insight)) {
    console.warn('Non constructor call made to Insight.constructor')
    return new Insight(...arguments)
  }

  this.url = url
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

  return simplePOST(this.url + '/api/tx/send', {rawtx: hex}, callback)
}

Insight.prototype.getUnspent = function (address, callback) {
  callback = prepareCallback(callback)

  return simpleGET(this.url + '/api/addr/' + address + '/utxo', callback)
}

Insight.prototype.getBalance = function (address, callback) {
  callback = prepareCallback(callback)

  return simpleGET(this.url + '/api/addr/' + address, {noTxList: 1}, callback)
}

Insight.prototype.getInfo = function (address, callback) {
  callback = prepareCallback(callback)

  return simpleGET(this.url + '/api/addr/' + address, callback)
}

Insight.prototype.getTransactions = function (address, callback) {
  callback = prepareCallback(callback)

  return simpleGET(this.url + '/api/addrs/' + address + '/txs', callback)
}

module.exports = Insight
