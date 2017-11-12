const bitcoin = require('bitcoinjs-lib')
const bMessage = require('bitcoinjs-message')
const coinNetworks = require('../coins/networks')

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
module.exports = Coin
