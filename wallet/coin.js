const bitcoin = require('bitcoinjs-lib')
const bMessage = require('bitcoinjs-message')
const callbackify = require('callbackify')
const coinNetworks = require('../coins/networks')
const util = require('../util')
const isValidAddress = util.validation.isValidAddress

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
  this.transactions = []
  this.utxo = []
  this.stxo = (stxo || [])
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
  this.stxo = newStxo
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
    fee = 0,
    outputs = [],
    txComment = ''
  } = options

  if (this.coinInfo.name !== 'florincoin') {
    txComment = ''
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
    amountSat += sat
    outputs[o] = sat
  }
  let feeSat = Math.floor((fee * this.coinInfo.satPerCoin) || this.coinInfo.minFee)

  if (this.balanceSat < amountSat + feeSat) {
    return Promise.reject(new Error('not enough unspent balance on key'))
  }

  let inputs = this.getBestUnspent(amountSat + feeSat)

  if (inputs.err !== null) {
    return Promise.reject(inputs)
  }

  let tx = new bitcoin.TransactionBuilder(this.coinInfo.network, this.coinInfo.maxFeePerByte)
  tx.setVersion(this.coinInfo.txVersion)

  let spentInputs = []
  for (let input of inputs.txo) {
    tx.addInput(input.txid, input.vout)
    spentInputs.push(input.txid)
  }

  for (let o in outputs) {
    if (!outputs.hasOwnProperty(o)) {
      continue
    }

    // if paying self don't create extra outputs
    if (o !== this.address) {
      tx.addOutput(o, outputs[o])
    } else {
      amountSat -= outputs[o]
    }
  }

  let calcFee = this.coinInfo.estimateFee(tx.buildIncomplete(), txComment.length)
  if (fee !== undefined) {
    calcFee = Math.max(calcFee, feeSat)
  }

  if (calcFee < this.coinInfo.minFee) {
    return Promise.reject(new Error('fee is too low for network ' + calcFee + ' sat'))
  }

  let changeSat = inputs.subTotal - amountSat - calcFee

  if (changeSat < 0) {
    return Promise.reject(new Error('attempted to spend more than available'))
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

  let rawTx = tx.build().toHex()

  if (txComment !== '') {
    rawTx += bitcoin.bufferutils.varIntBuffer(txComment.length).toString('hex') + Buffer.from(txComment).toString('hex')
  }

  return this.coinInfo.explorer.pushTX(rawTx).then((res) => {
    if (res.txid && changeVout !== undefined) {
      this.addUnconfirmed(res.txid, changeVout, changeSat / this.coinInfo.satPerCoin, changeSat, spentInputs)
    }
    return Promise.resolve(res)
  })
})

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

module.exports = Coin
