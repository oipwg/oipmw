const bitcoin = require('bitcoinjs-lib')

function isValidAddress (address, network) {
  try {
    let dec = bitcoin.address.fromBase58Check(address)
    return (dec.version === network.pubKeyHash)
  } catch (e) {
    return false
  }
}

function isValidPrivKey (priv, network) {
  throw new Error('Not implemented yet')
}

module.exports = {
  isValidAddress: isValidAddress,
  isValidPrivKey: isValidPrivKey
}
