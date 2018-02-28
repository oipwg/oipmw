const CryptoJS = require('crypto-js')
const bitcoin = require('bitcoinjs-lib')
const walletKeystore = require('./walletKeystore')
const callbackify = require('callbackify')
const Key = require('./key')
const networks = require('../coins/networks')
let config = require('./config')
const isValidAddress = require('../util').validation.isValidAddress

function Wallet (identifier, password, defaultCrypto, newConf) {
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
  this.extraInfo = {}

  if (newConf) {
    config = Object.assign({}, config, newConf)
  }

  walletKeystore.setURL(config.walletKeystoreURL)
}

function createNewWallet (options) {
  let {
    email = '',
    password = '',
    coins = 'florincoin',
    defaultCrypto = 'florincoin'
  } = options

  if (!Array.isArray(coins)) {
    coins = [coins]
  }

  return walletKeystore.create(email).then((wk) => {
    if (wk.error !== false) {
      return Promise.reject(new Error('WalletKeystore create failed: ' + wk.errorText))
    }

    let {identifier, shared_key: sk} = wk
    let wal = new Wallet(identifier, password, defaultCrypto)

    wal.sharedKey = sk
    wal.newAddress(coins[0])
    for (let c of coins) {
      wal.keys[0].addCoin(c)
    }

    return wal.store().then((storeResponse) => {
      if (storeResponse.error !== false) {
        return Promise.reject(new Error('Unable to store new wallet: ' + storeResponse.errorText))
      }

      return Promise.resolve(wal)
    })
  })
}

Wallet.prototype.load = callbackify(function () {
  if (this.sharedKey !== '') {
    let err = new Error('Wallet already loaded')
    return Promise.reject(err)
  }

  return walletKeystore.checkLoad(this.identifier).then((res) => {
    if (res.encryption_settings.algo === 'aes') {
      this.cryptoConfig = {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Iso10126
      }
      this.cryptoConfig.iterations = res.encryption_settings.iterations
    } else {
      let err = new Error('Unsupported wallet encryption')
      return Promise.reject(err)
    }

    if (res.gauth_enabled === true) {
      if (res.auth_key_isvalid !== true) {
        let err = new Error('2FA wallets not supported... yet')
        return Promise.reject(err)
      }
    }

    return walletKeystore.load(this.identifier).then((res) => {
      if (res.error === false) {
        let dec = decryptWallet(res.wallet, this.password, this.cryptoConfig)

        if (!dec) {
          return Promise.reject(new Error('Unable to decrypt wallet'))
        }

        this.sharedKey = dec.shared_key

        if (Array.isArray(dec.keys)) {
          this.keys = hydrateKeys(dec.keys)
        } else {
          this.keys = addressesToKeys(dec.addresses)
        }

        if (dec.extraInfo) { this.extraInfo = dec.extraInfo }
      }
    })
  })
})

Wallet.prototype.store = callbackify(function () {
  let encryptedWallet = encryptWallet(this)

  if (!encryptedWallet) {
    return Promise.reject(new Error('Unable to encrypt wallet'))
  }

  let data = {
    identifier: this.identifier,
    shared_key: this.sharedKey,
    wallet_data: encryptedWallet
  }

  return walletKeystore.store(data)
})

Wallet.prototype.getBalance = function (coinName) {
  coinName = coinName || this.defaultCrypto

  let balanceSat = 0
  let spc = 1

  for (let k of this.keys) {
    if (k.hasCoin(coinName)) {
      balanceSat += k.getBalanceSat(coinName)
      spc = k.coins[coinName].coinInfo.satPerCoin
    }
  }

  return balanceSat / spc
}

Wallet.prototype.getBalanceSat = function (coinName) {
  coinName = coinName || this.defaultCrypto

  let balanceSat = 0

  for (let k of this.keys) {
    if (k.hasCoin(coinName)) {
      balanceSat += k.getBalanceSat(coinName)
    }
  }

  return balanceSat
}

Wallet.prototype.getMainAddress = function (coinName) {
  coinName = coinName || this.defaultCrypto

  for (let k of this.keys) {
    if (k.hasCoin(coinName)) {
      return k.getAddress(coinName)
    }
  }
  return ''
}

Wallet.prototype.getPrivateKey = function (address) {
  if (isValidAddress(address)) {
    for (let k of this.keys) {
      let name = k.getNameFromAddress(address)
      if (name !== '') {
        return k.coins[name].privKey
      }
    }
  }
  return ''
}

Wallet.prototype.getKeyFromAddress = function (address) {
  if (isValidAddress(address)) {
    for (let key of this.keys) {
      let name = key.getNameFromAddress(address)
      if (name !== '') {
        return key
      }
    }
  }
  return ''
}

Wallet.prototype.payTo = callbackify.variadic(function (from, toAddress, amount, options) {
  let {
    fee = 0
  } = options

  let key, coinName

  if (isValidAddress(from)) {
    for (let k of this.keys) {
      let name = k.getNameFromAddress(from)
      if (name !== '') {
        key = k
        coinName = name
      }
    }
  } else {
    coinName = from
    for (let k of this.keys) {
      if (k.hasCoin(coinName)) {
        if (k.getBalance(coinName) > ((amount + fee) || amount)) {
          key = k
        }
      }
    }
  }

  if (key === undefined) {
    return Promise.reject(new Error('No key found for ' + from))
  }

  return key.payTo(coinName, toAddress, amount, options)
})

Wallet.prototype.payToMulti = callbackify.variadic(function (from, options) {
  let {
    fee = 0
  } = options

  let key, coinName

  if (typeof options === 'undefined') {
    return Promise.reject(new Error('No options passed, options is required!'))
  }

  if (isValidAddress(from)) {
    for (let k of this.keys) {
      let name = k.getNameFromAddress(from)
      if (name !== '') {
        key = k
        coinName = name
      }
    }
  } else {
    let totalAmount

    coinName = from

    for (let amount of options.outputs) {
      totalAmount += amount
    }

    for (let k of this.keys) {
      if (k.hasCoin(coinName)) {
        if (k.getBalance(coinName) > ((totalAmount + fee) || totalAmount)) {
          key = k
        }
      }
    }
  }

  if (key === undefined) {
    return Promise.reject(new Error('No key found for ' + from))
  }

  return key.payToMulti(coinName, options)
})

Wallet.prototype.refreshBalances = callbackify(function () {
  let p = []

  for (let key of this.keys) {
    p.push(key.refreshBalance())
  }

  return Promise.all(p)
})

Wallet.prototype.refreshUnspent = callbackify(function () {
  let p = []

  for (let key of this.keys) {
    p.push(key.refreshUnspent())
  }

  return Promise.all(p)
})

Wallet.prototype.refreshTransactions = callbackify(function () {
  let p = []

  for (let key of this.keys) {
    p.push(key.refreshTransactions())
  }

  return Promise.all(p)
})

Wallet.prototype.refresh = callbackify(function () {
  return Promise.all([this.refreshTransactions(), this.refreshUnspent()])
})

function decryptWallet (wallet, password, cryptoConfig) {
  try {
    let bytes = CryptoJS.AES.decrypt(wallet, password, cryptoConfig)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch (e) {
    return false
  }
}

function encryptWallet (wallet) {
  try {
    let bytes = CryptoJS.AES.encrypt(JSON.stringify(wallet), wallet.password, wallet.cryptoConfig)
    return bytes.toString()
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

function hydrateKeys (dryKeys) {
  let keys = []

  for (let dk of dryKeys) {
    keys.push(new Key(dk))
  }

  return keys
}

Wallet.prototype.toJSON = function () {
  return {
    shared_key: this.sharedKey,
    keys: this.keys
  }
}

Wallet.prototype.newAddress = function (coinName) {
  coinName = coinName || this.defaultCrypto

  if (!networks.isSupported(coinName)) {
    return ''
  }

  let net = networks.getNetwork(coinName)
  let keyPair = bitcoin.ECPair.makeRandom({network: net})
  let k = new Key(keyPair.toWIF(), coinName)

  this.keys.push(k)

  return keyPair.getAddress()
}

Wallet.prototype.newShortMWAddress = function () {
  let supportedCoins = networks.listSupportedCoins()
  let shortMWAddress

  for (var i in supportedCoins) {
    let net = networks.getNetwork(supportedCoins[i])
    let keyPair = bitcoin.ECPair.makeRandom({network: net})
    let k = new Key(keyPair.toWIF(), supportedCoins[i])

    this.keys.push(k)

    if (!shortMWAddress) { shortMWAddress = k.getShortMultiwalletAddress() }
  }

  return shortMWAddress
}

Wallet.prototype.listAddresses = function (coinName) {
  coinName = coinName || this.defaultCrypto

  let addresses = []

  for (let k of this.keys) {
    if (k.hasCoin(coinName)) {
      addresses.push(k.getAddress(coinName))
    }
  }

  return addresses
}

Wallet.prototype.signMessage = function (address, message) {
  for (let k of this.keys) {
    if (k.containsAddress(address)) {
      return k.signMessage(address, message)
    }
  }
  return ''
}

Wallet.prototype.verifyMessage = function (address, message, signature) {
  for (let k of this.keys) {
    if (k.containsAddress(address)) {
      return k.verifyMessage(address, message, signature)
    }
  }
  return false
}

Wallet.prototype.addUnconfirmedRawTransaction = function (txinfo, coinName) {
  coinName = coinName || 'florincoin'

  for (let vout of txinfo.vout) {
    for (let address of vout.scriptPubKey.addresses) {
      for (let k of this.keys) {
        if (k.hasCoin(coinName)) {
          if (address === k.getAddress(coinName)) {
            let txid = txinfo.txid
            let vn = vout.n
            let amount = vout.value
            let satoshi = Math.floor(amount * k.coins[coinName].coinInfo.satPerCoin)
            let inputs = []
            k.coins[coinName].addUnconfirmed(txid, vn, amount, satoshi, inputs)
          }
        }
      }
    }
  }
}

Wallet.prototype.sendAllQueue = function () {
  for (let k of this.keys) {
    k.sendQueue()
  }
}

Wallet.prototype.getExtraInfo = function () {
  return this.extraInfo
}

Wallet.prototype.setExtraInfo = function (newInfo) {
  if (newInfo) { this.extraInfo = newInfo }
}

module.exports = {createNewWallet: callbackify(createNewWallet), Wallet}
