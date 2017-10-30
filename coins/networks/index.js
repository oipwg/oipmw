const supportedCoins = {
  'florincoin': require('./florincoin'),
  'litecoin': require('./litecoin'),
  'bitcoin': require('./bitcoin'),
  'bitcoin_testnet': require('./bitcoin_testnet')
}

const supportedCoinsArray = [
  supportedCoins['florincoin'].network,
  supportedCoins['litecoin'].network,
  supportedCoins['bitcoin'].network,
  supportedCoins['bitcoin_testnet'].network
]

function listSupportedCoins () {
  return Object.keys(supportedCoins)
}

function getNetwork (coinName) {
  return supportedCoins[coinName]
}

function isSupported (coinName) {
  return typeof supportedCoins[coinName] !== 'undefined'
}

module.exports = {
  getNetwork: getNetwork,
  supportedNetworks: supportedCoinsArray,
  isSupported: isSupported,
  listSupportedCoins: listSupportedCoins
}
