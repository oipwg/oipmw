const bcrypto = require('bitcoinjs-lib').crypto
const Insight = require('../coins/explorers/insight')
const Key = require('./key')

jest.mock('../coins/explorers/insight')
Insight.prototype.pushTX.mockImplementation((tx) => {
  return Promise.resolve({txid: bcrypto.hash256(Buffer.from(tx, 'hex')).reverse().toString('hex')})
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
    expect(res.txid).toBe('cdf9581d413286dc1c6ccb7d2b0ca105879c29932364668d579ed2621dffe60a')
  })
})

test('payto self  florincoin', () => {
  let key = new Key('RA4KK8pCiFuviH7M4e2k65mmLCH2bLr7kJ6wAHP2TPMdBPVnJoqW', 'florincoin')

  key.coins['florincoin'].utxo = [
    {
      'address': 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s',
      'txid': 'cdf9581d413286dc1c6ccb7d2b0ca105879c29932364668d579ed2621dffe60a',
      'vout': 0,
      'ts': 1510069808,
      'scriptPubKey': '76a9144f3a411d38966b259484338306c46924e616b53388ac',
      'amount': 1,
      'satoshis': 100000000,
      'confirmations': 6,
      'confirmationsFromCache': true
    },
    {
      'address': 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s',
      'txid': '02c85b5cacecfeede339bb7874f250c7731d986c727283ee0c91cf5c96e52b11',
      'vout': 0,
      'ts': 1508836658,
      'scriptPubKey': '76a9144f3a411d38966b259484338306c46924e616b53388ac',
      'amount': 10,
      'satoshis': 1000000000,
      'confirmations': 6,
      'confirmationsFromCache': true
    }
  ]

  key.coins['florincoin'].balanceSat = 1100000000

  expect.hasAssertions()

  return key.payTo('florincoin', 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s', 1, 'i r kool').then((res) => {
    expect(res.txid).toBe('e12803c36c34046b15ea6c8a1494b23a3626b6e2ad6dfdcd84ac72ab947e97dc')
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
    expect(res.txid).toBe('32941968b44faaf224d58f6c21cb1cb58e36fdb168d68dfa2fbfb4254a6454cc')
  })
})

test('payto chain', () => {
  expect.assertions(6)

  let key = new Key('RA4KK8pCiFuviH7M4e2k65mmLCH2bLr7kJ6wAHP2TPMdBPVnJoqW', 'florincoin')

  key.coins['florincoin'].utxo = [
    {
      'address': 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s',
      'txid': '24f41478901776dcf366120ecbb9fd834923ed553463bf9b8568e309b4940a63',
      'vout': 0,
      'ts': 1510358163,
      'scriptPubKey': '76a9144f3a411d38966b259484338306c46924e616b53388ac',
      'amount': 10.959,
      'satoshis': 1095900000,
      'confirmations': 17,
      'confirmationsFromCache': false
    }
  ]

  key.coins['florincoin'].balanceSat = 1095900000

  return key.payTo('florincoin', 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s', 10, 0.01, 'hello world').then((res) => {
    expect(res.txid).toBe('9a6bb4ba71193747ee410dca43fb9129b9ec77371729c3846bf2ac69e4c44d0a')

    return key.payTo('florincoin', 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s', 10, 0.01, 'hello world').then((res) => {
      expect(res.txid).toBe('2f23170f3d1d5b1df681a3a27da28a782b784bc8ac132cf4e9b4e3b52930dbec')

      return key.payTo('florincoin', 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s', 10, 0.01, 'hello world').then((res) => {
        expect(res.txid).toBe('6150afed30db86910878aa947651df3c8a8076ba3068f002e89009e7b01c9468')

        return key.payTo('florincoin', 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s', 10, 0.003, 'hello world').then((res) => {
          expect(res.txid).toBe('3a20c03798be77b95c8af8952dfb2feeb22bdf53828e8993e6c4b8d189069c25')

          return key.payTo('florincoin', 'FDEAciuFexEHy1kiLKRt34e2PybTyhdGZC', 1, 'hello world').then((res) => {
            expect(res.txid).toBe('8362e54bb19e917fa9678d0f36bd1e19f47573fd2a1e8990629ffb818e0bf97b')

            return key.payTo('florincoin', 'FDEAciuFexEHy1kiLKRt34e2PybTyhdGZC', 2, 'hello world').then((res) => {
              expect(res.txid).toBe('58b90b1cb006c45f3d7d67fa2eeb9e6ee53b6dce75b382e3c67f3944ecb83b18')
            })
          })
        })
      })
    })
  })
})
