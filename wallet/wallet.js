const CryptoJS = require('crypto-js')
const flovault = require('./flovault')
const prepareCallback = require('../util').prepareCallback
const Key = require('./key')
const networks = require('../coins/networks')

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
  this.keys = []
}

Wallet.prototype.load = function (callback) {
  callback = prepareCallback(callback)

  if (this.sharedKey !== '') {
    let err = new Error('Wallet already loaded')
    callback(err)
    return Promise.reject(err)
  }

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
        this.sharedKey = dec.shared_key

        if (Array.isArray(dec.keys)) {
          this.keys = dec.keys
        } else {
          this.keys = addressesToKeys(dec.addresses)
        }

        callback()
      }
    })
  })
}

Wallet.prototype.refreshBalances = function (callback) {
  callback = prepareCallback(callback)

  let p = []

  for (let key of this.keys) {
    p.push(key.refreshBalance())
  }

  return Promise.all(p).then((res) => {
    callback(null, res)
    return Promise.resolve(res)
  }, (err) => {
    callback(err)
    return Promise.reject(err)
  })
}

Wallet.prototype.refreshUnspent = function (callback) {
  callback = prepareCallback(callback)

  let p = []

  for (let key of this.keys) {
    p.push(key.refreshUnspent())
  }

  return Promise.all(p).then((res) => {
    callback(null, res)
    return Promise.resolve(res)
  }, (err) => {
    callback(err)
    return Promise.reject(err)
  })
}

Wallet.prototype.refresh = function (callback) {
  callback = prepareCallback(callback)

  return Promise.all([this.refreshBalances(), this.refreshUnspent()]).then((res) => {
    callback(null, res)
    return Promise.resolve(res)
  }, (err) => {
    callback(err)
    return Promise.reject(err)
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

function addressesToKeys (addresses) {
  let keys = []
  for (let addrStr in addresses) {
    if (addresses.hasOwnProperty(addrStr)) {
      let addr = addresses[addrStr]
      let k = new Key(addr.priv)

      networks.listSupportedCoins().forEach((coinName) => {
        k.addCoin(coinName)
      })

      keys.push(k)
    }
  }
  return keys
}

module.exports = Wallet
