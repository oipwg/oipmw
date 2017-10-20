const CryptoJS = require('crypto-js')
const flovault = require('./flovault')
const prepareCallback = require('../util/prepareCallback')

function Wallet (identifier, password, defaultCrypto) {
  if (!(this instanceof Wallet)) {
    console.warn('Non constructor call made to Wallet.constructor')
    return new Wallet(...arguments)
  }

  this.identifier = identifier || ''
  this.password = password || ''
  this.defaultCrypto = defaultCrypto || 'florincoin'
  this.cryptoConfig = {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Iso10126,
    iterations: 5
  }
  this.sharedKey = ''
  this.addresses = []
}

Wallet.prototype.load = function (callback) {
  callback = prepareCallback(callback)
  return flovault.checkLoad(this.identifier).then((res) => {
    if (res.encryption_settings.algo === 'aes') {
      this.cryptoConfig = {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Iso10126
      }
      this.cryptoConfig.iterations = res.encryption_settings.iterations
    } else {
      let err = new Error('Unsupported wallet encryption')
      callback(err)
      return Promise.reject(err)
    }

    if (res.gauth_enabled === true) {
      if (res.auth_key_isvalid !== true) {
        let err = new Error('2FA wallets not supported... yet')
        callback(err)
        return Promise.reject(err)
      }
    }

    return flovault.load(this.identifier).then((res) => {
      if (res.error === false) {
        let dec = decryptWallet(res.wallet, this.password, this.cryptoConfig)
        console.log(dec)
        callback()
      }
    })
  })
}

function decryptWallet (wallet, password, cryptoConfig) {
  try {
    let bytes = CryptoJS.AES.decrypt(wallet, password, cryptoConfig)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch (e) {
    return false
  }
}

module.exports = Wallet
