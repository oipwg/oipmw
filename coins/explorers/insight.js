const prepareCallback = require('../../util').prepareCallback
const Transaction = require('bitcoinjs-lib').Transaction
const simplePOST = require('../../util').simplePOST

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

module.exports = Insight
