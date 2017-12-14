const bitcoin = require('bitcoinjs-lib')
const bcrypto = bitcoin.crypto
const bMessage = require('bitcoinjs-message')
const callbackify = require('callbackify')
const coinNetworks = require('../coins/networks')
const util = require('../util')
const isValidAddress = util.validation.isValidAddress
const PaymentQueue = require('./paymentQueue')
const TransactionBuilder = bitcoin.TransactionBuilder

function Coin (coinName, privKey, stxo) {
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
    this.privKey = this.ecKey.toWIF()
  }

  this.address = this.ecKey.getAddress().toString()
  this.scriptPubKey = bitcoin.address.toOutputScript(this.address, this.coinInfo.network)
  this.balanceSat = 0
  this.transactionsHistory = {confirmed: [], queued: [], unconfirmed: []}
  this.utxo = []
  this.stxo = (stxo || [])
  this.pq = new PaymentQueue(this)
}

Coin.prototype.toJSON = function () {
  return {
    privKey: this.privKey,
    address: this.address,
    coinName: this.coinInfo.name,
    stxo: this.stxo
  }
}

Coin.prototype.addUnconfirmed = function (txid, vout, amount, satoshis, inputs) {
  this.balanceSat += satoshis
  this.stxo.push(
    {
      'address': this.address,
      'txid': txid,
      'vout': vout,
      'ts': Math.floor(Date.now() / 1000),
      'scriptPubKey': this.scriptPubKey,
      'amount': amount,
      'satoshis': satoshis,
      'inputs': inputs
    })

  this.mergeTxo()
}

Coin.prototype.mergeTxo = function () {
  let newUtxo = []
  let newStxo = []
  let unconfStxo = []

  for (let ut of this.utxo) {
    let spent = false
    for (let st of this.stxo) {
      if (st.inputs.includes(ut.txid)) {
        spent = true
      }
    }
    if (!spent) {
      newUtxo.push(ut)
    }
  }

  for (let st1 of this.stxo) {
    let spent = false
    for (let st2 of this.stxo) {
      if (st2.inputs.includes(st1.txid)) {
        spent = true
      }
    }
    if (!spent) {
      newStxo.push(st1)
    }
  }

  for (let st of newStxo) {
    let confirmed = false
    for (let ut of newUtxo) {
      if (st.txid === ut.txid && st.vout === ut.vout) {
        confirmed = true
      }
    }
    if (!confirmed) {
      unconfStxo.push(st)
    }
  }

  for (let st of unconfStxo) {
    newUtxo.push({
      'address': st.address,
      'txid': st.txid,
      'vout': st.vout,
      'ts': st.ts,
      'scriptPubKey': st.scriptPubKey,
      'amount': st.amount,
      'satoshis': st.satoshis,
      'confirmations': -1
    })
  }

  this.utxo = newUtxo
  this.stxo = unconfStxo
  this.balanceSat = newUtxo.reduce((sum, utxo) => sum + utxo.satoshis, 0)
}

Coin.prototype.signMessage = function (message) {
  let signature = bMessage.sign(message, this.ecKey.d.toBuffer(32), this.ecKey.compressed, this.coinInfo.networks.messagePrefix)
  return signature.toString('base64')
}

Coin.prototype.verifyMessage = function (message, signature) {
  return bMessage.verify(message, this.address, signature, this.coinInfo.network.messagePrefix)
}

Coin.prototype.payTo = callbackify.variadic(function (options) {
  let {
    q = false,
    fee = 0,
    outputs = {}
  } = options

  if (this.coinInfo.name !== 'florincoin') {
    options.txComment = ''
  }

  // if (outputs.length === 0) {
  //   return Promise.reject(new Error('No outputs on transaction, entire balance would be sent to miners'))
  // }

  let amountSat = 0
  for (let o in outputs) {
    if (!outputs.hasOwnProperty(o)) {
      continue
    }

    if (!isValidAddress(o, this.coinInfo.network)) {
      return Promise.reject(new Error('invalid address'))
    }

    // convert amounts to satoshi
    let sat = Math.floor(outputs[o] * this.coinInfo.satPerCoin)
    if (sat < this.coinInfo.dust) {
      return Promise.reject(new Error('transaction contains dust output ' + sat + ' sat to ' + o))
    }

    // if paying self don't create extra outputs
    if (o === this.address) {
      delete outputs[o]
    } else {
      amountSat += sat
      outputs[o] = sat
    }
  }
  let feeSat = Math.floor((fee * this.coinInfo.satPerCoin) || this.coinInfo.minFee)

  if (this.balanceSat < amountSat + feeSat) {
    return Promise.reject(new Error('not enough unspent balance on key'))
  }

  options.amountSat = amountSat
  options.feeSat = feeSat
  options.outputSat = outputs

  if (q === false) {
    return this._directSendPayment(options)
  } else {
    return this.pq.add(options)
  }
})

Coin.prototype._buildTX = function (options) {
  let {
    fee = 0,
    outputSat = {},
    txComment = '',
    amountSat,
    feeSat
  } = options

  let inputs = this.getBestUnspent(amountSat + feeSat)

  if (inputs.err !== null) {
    return new Error(inputs.err)
  }

  let tx = new bitcoin.TransactionBuilder(this.coinInfo.network, this.coinInfo.maxFeePerByte)
  tx.setVersion(this.coinInfo.txVersion)

  let spentInputs = []
  for (let input of inputs.txo) {
    tx.addInput(input.txid, input.vout)
    spentInputs.push(input.txid)
  }

  for (let o in outputSat) {
    if (!outputSat.hasOwnProperty(o)) {
      continue
    }
    tx.addOutput(o, outputSat[o])
  }

  let calcFee = this.coinInfo.estimateFee(tx.buildIncomplete(), txComment.length)
  if (fee !== undefined) {
    calcFee = Math.max(calcFee, feeSat)
  }

  if (calcFee < this.coinInfo.minFee) {
    return new Error('fee is too low for network ' + calcFee + ' sat')
  }

  let changeSat = inputs.subTotal - amountSat - calcFee

  if (changeSat < 0) {
    return new Error('attempted to spend more than available')
  }

  if (changeSat < this.coinInfo.dust) {
    // if change would be dust add it to the fee
    changeSat = 0
  }

  let changeVout
  if (changeSat > 0) {
    changeVout = tx.addOutput(this.address, changeSat)
  }

  for (let i = 0; i < inputs.txo.length; i++) {
    tx.sign(i, this.ecKey)
  }

  if (changeVout !== undefined) {
    this.addUnconfirmed(this.getTxId(tx, txComment), changeVout, changeSat / this.coinInfo.satPerCoin, changeSat, spentInputs)
  }

  return {tx, changeVout, changeSat, spentInputs, txComment}
}

Coin.prototype.getTxId = function (tx, txComment) {
  let txh = tx.build().toHex()
  if (this.coinInfo.name === 'florincoin') {
    txh += bitcoin.bufferutils.varIntBuffer(txComment.length).toString('hex') + Buffer.from(txComment).toString('hex')
  }
  return bcrypto.hash256(Buffer.from(txh, 'hex')).reverse().toString('hex')
}

Coin.prototype._directSendPayment = function (options) {
  let tx, txComment

  if (options.tx instanceof TransactionBuilder) {
    tx = options.tx
    txComment = options.txComment
  } else {
    let built = this._buildTX(options)
    if (built instanceof Error) {
      return Promise.reject(built)
    }
    tx = built.tx
    txComment = built.txComment
  }

  let rawTx = tx.build().toHex()

  if (this.coinInfo.name === 'florincoin') {
    rawTx += bitcoin.bufferutils.varIntBuffer(txComment.length).toString('hex') + Buffer.from(txComment).toString('hex')
  }

  return this.coinInfo.explorer.pushTX(rawTx)
}

Coin.prototype.getBestUnspent = function (amountSat) {
  let subTotal = 0
  let txo = []

  let utxos = this.utxo.sort((a, b) => {
    // Sort first by confirmations then amount + to -
    if (a.confirmations < b.confirmations) {
      return -1
    }
    if (a.confirmations > b.confirmations) {
      return 1
    }
    return b.satoshis - a.satoshis
  })

  let s = utxos.some((utxo) => {
    subTotal += utxo.satoshis
    txo.push(utxo)

    if (subTotal >= amountSat) {
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

Coin.prototype.refreshTransactions = function () {
  this.transactionsHistory.queued = []
  this.transactionsHistory.unconfirmed = []

  this.coinInfo.explorer.getTransactions(this.address, 0).then((res) => {
    this.transactionsHistory.confirmed = res

    for (let st of this.stxo) {
      this.transactionsHistory.unconfirmed.push({
        txid: st.txid,
        to: st.address,
        amount: st.amount,
        satoshis: st.satoshis,
        timestamp: st.ts
      })
    }

    for (let qt of this.pq.q) {
      let thq = {
        to: [],
        from: this.address,
        amount: qt.amountSat / this.coinInfo.satPerCoin,
        satoshis: qt.amountSat
      }

      for (let o in qt.outputSat) {
        if (!qt.outputSat.hasOwnProperty(o)) {
          continue
        }
        thq.to.push(o)
      }

      this.transactionsHistory.queued.push(thq)
    }
  })

  return Promise.resolve(this.transactionsHistory)
}

module.exports = Coin
