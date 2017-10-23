const supportedCoins = {
  'florincoin': require('coins/networks/florincoin'),
  'litecoin': require('coins/networks/litecoin'),
  'bitcoin': require('coins/networks/bitcoin'),
  'bitcoin_testnet': require('coins/networks/bitcoin_testnet')
}

function getNetwork (coinName) {
  return supportedCoins[coinName]
}

function isSupported (coinName) {
  return typeof supportedCoins[coinName] !== 'undefined'
}

module.exports = {
  getNetwork: getNetwork,
  isSupported: isSupported
}
