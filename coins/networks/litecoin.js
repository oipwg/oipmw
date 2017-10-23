exports.name = 'litecoin'
exports.ticker = 'ltc'

const explorers = require('../explorers')
exports.explorer = new explorers.Insight('https://insight.litecore.io/')
exports.backupExplorers = []

exports.network = require('bitcoinjs-lib').networks.litecoin
