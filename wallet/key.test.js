const bcrypto = require('bitcoinjs-lib').crypto
const Insight = require('../coins/explorers/insight')
const Key = require('./key')

jest.mock('../coins/explorers/insight')
Insight.prototype.pushTX.mockImplementation((tx) => {
  return Promise.resolve(bcrypto.hash256(Buffer.from(tx, 'hex')).reverse().toString('hex'))
})

test('payto florincoin', () => {
  let key = new Key('RAo87DBFGGcpLD9KvQrgkVtynPCniTNMW9i8pyVmcY8Hsyzyxy5B', 'florincoin')

  key.coins['florincoin'].utxo = [{
    'address': 'FDEAciuFexEHy1kiLKRt34e2PybTyhdGZC',
    'amount': 9.997,
    'satoshis': 999700000,
    'confirmations': 6,
    'confirmationsFromCache': true,
    'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
    'ts': 1508836658,
    'txid': '02c85b5cacecfeede339bb7874f250c7731d986c727283ee0c91cf5c96e52b11',
    'vout': 1
  }]

  key.coins['florincoin'].balanceSat = 999700000

  expect.hasAssertions()

  return key.payTo('florincoin', 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s', 1, 'yolo swag').then((res) => {
    expect(res).toBe('cdf9581d413286dc1c6ccb7d2b0ca105879c29932364668d579ed2621dffe60a')
  })
})

test('key payto testnet', () => {
  expect.hasAssertions()

  let key = new Key('RAo87DBFGGcpLD9KvQrgkVtynPCniTNMW9i8pyVmcY8Hsyzyxy5B', 'bitcoin_testnet')

  key.coins['bitcoin_testnet'].utxo = [
    {
      'address': 'mnv1SyZ9cfSt7xMJCCk6tbKpEKBA5gBknL',
      'txid': 'a6cfa5e6c401ae4daad973c3cbd4abf88e07cf36a581480acd4f5ee1ea659ad3',
      'vout': 0,
      'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
      'amount': 0.9,
      'satoshis': 90000000,
      'height': 1225858,
      'confirmations': 21
    },
    {
      'address': 'mnv1SyZ9cfSt7xMJCCk6tbKpEKBA5gBknL',
      'txid': '5d4522368860b94f9ce4ba28633a879a8804e63214d1b4c9bc475856acf6521f',
      'vout': 0,
      'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
      'amount': 1.8,
      'satoshis': 180000000,
      'height': 1225858,
      'confirmations': 21
    },
    {
      'address': 'mnv1SyZ9cfSt7xMJCCk6tbKpEKBA5gBknL',
      'txid': 'aac726419638daeb474d4de0cf41199ba7c1687493f865e0a52174a210df4178',
      'vout': 1,
      'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
      'amount': 0.03826225,
      'satoshis': 3826225,
      'height': 1225885,
      'confirmations': 26
    }
  ]

  key.coins['bitcoin_testnet'].balanceSat = 323926225

  return key.payTo('bitcoin_testnet', 'mnjsTntSJP6E14jVcNsNFBje3tSo7y4pGi', 0.5).then((res) => {
    expect(res).toBe('32941968b44faaf224d58f6c21cb1cb58e36fdb168d68dfa2fbfb4254a6454cc')
  })
})
