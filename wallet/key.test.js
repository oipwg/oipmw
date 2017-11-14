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

test('payto bitcoin', () => {
  let key = new Key('RAo87DBFGGcpLD9KvQrgkVtynPCniTNMW9i8pyVmcY8Hsyzyxy5B', 'bitcoin')

  key.coins['bitcoin'].utxo = [{
    'address': '18Q49vUAoe1dLqsgUdmj4g7VNKaT7kHDYt',
    'txid': '4eed7d328bd6fc2a4aea779f016a441594048e5c95b8a5ed726dca01fa48c363',
    'vout': 0,
    'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
    'amount': 0.005,
    'satoshis': 500000,
    'height': 494117,
    'confirmations': 115
  },
  {
    'address': '18Q49vUAoe1dLqsgUdmj4g7VNKaT7kHDYt',
    'txid': '12f5e5b512e8264cd8ef1b49ab150f4eebe4885a1de8d85dbf7ec7fe056f0f89',
    'vout': 1,
    'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
    'amount': 0.002,
    'satoshis': 200000,
    'height': 494115,
    'confirmations': 117
  }]

  key.coins['bitcoin'].balanceSat = 700000

  expect.hasAssertions()

  return key.payTo('bitcoin', '186fmKh9Uy1uL1LYDT3MYxrapnEeUvNbUr', 0.006).then((res) => {
    expect(res.txid).toBe('bbcc7a02d38f3047e8810d1a65a53b2e927cbbc32dfdec6a9571deab916edc2b')
  })
})

test('payto litecoin', () => {
  let key = new Key('RAo87DBFGGcpLD9KvQrgkVtynPCniTNMW9i8pyVmcY8Hsyzyxy5B', 'litecoin')

  key.coins['litecoin'].utxo = [{
    'address': 'LSd1R8mztJFgbeZqemm2LhBFaXwjFP9Exk',
    'txid': '07835392c91ded74c8a4d0e2f60f98175eaff58cafa995ad58caad3844cffe46',
    'vout': 0,
    'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
    'amount': 0.03292596,
    'satoshis': 3292596,
    'height': 1311667,
    'confirmations': 962
  }]

  key.coins['litecoin'].balanceSat = 3292596

  expect.hasAssertions()

  return key.payTo('litecoin', 'LiFgCNF4XAZAdSdnqbRdsMEr4yVzx1thqZ', 0.03192596).then((res) => {
    expect(res.txid).toBe('13082f72abec2638b103aaf2f88344199344b2dac50c6fac2ffe9b1b8542b3a5')
  })
})

test('key payto multi testnet', () => {
  expect.hasAssertions()

  let key = new Key('RA4KK8pCiFuviH7M4e2k65mmLCH2bLr7kJ6wAHP2TPMdBPVnJoqW', 'bitcoin_testnet')

  key.coins['bitcoin_testnet'].utxo = [
    {
      'address': 'mnjsTntSJP6E14jVcNsNFBje3tSo7y4pGi',
      'txid': '32941968b44faaf224d58f6c21cb1cb58e36fdb168d68dfa2fbfb4254a6454cc',
      'vout': 0,
      'scriptPubKey': '76a9144f3a411d38966b259484338306c46924e616b53388ac',
      'amount': 0.5,
      'satoshis': 50000000,
      'height': 1226907,
      'confirmations': 3393
    },
    {
      'address': 'mnjsTntSJP6E14jVcNsNFBje3tSo7y4pGi',
      'txid': 'aac726419638daeb474d4de0cf41199ba7c1687493f865e0a52174a210df4178',
      'vout': 0,
      'scriptPubKey': '76a9144f3a411d38966b259484338306c46924e616b53388ac',
      'amount': 0.5,
      'satoshis': 50000000,
      'height': 1225885,
      'confirmations': 4415
    },
    {
      'address': 'mnjsTntSJP6E14jVcNsNFBje3tSo7y4pGi',
      'txid': 'd1699bd8dd12b2a5e96d922ee3845dd00e0e8a122ff9d5e94f16fd0d411c2e70',
      'vout': 0,
      'scriptPubKey': '76a9144f3a411d38966b259484338306c46924e616b53388ac',
      'amount': 0.5,
      'satoshis': 50000000,
      'height': 1225853,
      'confirmations': 4447
    }
  ]

  key.coins['bitcoin_testnet'].balanceSat = 150000000

  return key.payToMulti('bitcoin_testnet', {'n2eMqTT929pb1RDNuqEnxdaLau1rxy3efi': 0.25, '2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF': 0.25, 'mv4rnyY3Su5gjcDNzbMLKBQkBicCtHUtFB': 0.25}).then((res) => {
    expect(res.txid).toBe('5b88a8e99667980d2b024713becf319c463b7d3f390a2335b979f41421f5b0b2')
  })
})

test.skip('payto florincoin newly registered publisher', () => {
  let key = new Key('REPhpBrtcoJpGyj1JZpMeX241gcPQR8P6rwuikneCYX45LiWR1Nn', 'florincoin')

  key.coins['florincoin'].utxo = [
    {
      'address': 'F6Txsas2LBGphB4uVb1X2es6Voq2G75WSZ',
      'txid': '5f5e39a5ccc3163c9bbfc873e63f9c48b301d0814ba96b3a8636fce5d1ab5b0b',
      'vout': 0,
      'ts': 1510617147,
      'scriptPubKey': '76a91406f838560356e6c5cd231e9108e4e3510d41dc7e88ac',
      'amount': 0.99354661,
      'satoshis': 99354661,
      'confirmations': 5,
      'confirmationsFromCache': false
    }
  ]

  key.coins['florincoin'].balanceSat = 99354661

  expect.hasAssertions()

  return key.payTo('florincoin', 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s', 0.5, 0.1, 'yolo swag').then((res) => {
    expect(res.txid).toBe('d202718a3c574d5b28f284c6ad81e11819753570377684052447d4b1fecf4331')
  })
})

// 02000000010b5babd1e5fc36863a6ba94b81d001b3489c3fe673c8bf9b3c16c3cca5395e5f000000006a473044022045d13ea3afcf74bf6828bd95075af47b4f5a776486e07e298811536a72e10fb802202c110bcd87df5964cf79931e58099be8424031234f2d3cbf3fc420f9b1e91f1d012102979e935915b36b6847f12196fb59eb87f97f44562afe99852560da3f368ea2b2ffffffff0200e1f505000000001976a9144f3a411d38966b259484338306c46924e616b53388acd2e94035000000001976a91406f838560356e6c5cd231e9108e4e3510d41dc7e88ac0000000009796f6c6f2073776167

test('payto florincoin newly registered publisher after publish', () => {
  let key = new Key('R9sAKHYM5FxFbUggFZVs3SX2zzfnBpZsDo7ay79dK6uG2pr8eMkP', 'florincoin')

  key.coins['florincoin'].utxo = [
    {
      'address': 'FK1RmpknqVnMgbh58NyeopUrKcV5DvfDsc',
      'txid': '10cd935c3ca821363b6fb553f23ad480bd55732c12b1ac719f6b0b498e4bbb03',
      'vout': 0,
      'ts': 1510620418,
      'scriptPubKey': '76a914908d14707ae54c0e12916ae0713bffcbff94e81188ac',
      'amount': 0.987029,
      'satoshis': 98702900,
      'confirmations': 6,
      'confirmationsFromCache': true
    }
  ]

  key.coins['florincoin'].balanceSat = 98702900

  expect.hasAssertions()

  return key.payTo('florincoin', 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s', 0.5, 0.1, 'do you like scarecrows?').then((res) => {
    expect(res.txid).toBe('eaf5687248115795ce68618fb005311819cb54f083a5829b4788e2b6c2848044')
  })
})

// 020000000103bb4b8e490b6b9f71acb1122c7355bd80d43af253b56f3b3621a83c5c93cd10000000006a473044022072d9630c3d353333fe32b627089297ecbdf13e692046199fdf203eaf3fee8db702207922f53d69b9c92c141bf64050cb76a4f19f2cdf6e9ea0cfbe47369367d2e0ee012103d663803033c9abdda21a9ef9f2c8141eb245f145322cbee58aa6c8c1a7cef324ffffffff0280f0fa02000000001976a9144f3a411d38966b259484338306c46924e616b53388ac348f4e02000000001976a914908d14707ae54c0e12916ae0713bffcbff94e81188ac0000000017646f20796f75206c696b6520736361726563726f77733f

test('payto florincoin dust output', () => {
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

  return key.payTo('florincoin', 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s', 0.0001, 'yolo swag').catch((err) => {
    expect(err).toBeDefined()
    expect(err.message.startsWith('transaction contains dust output')).toBe(true)
  })
})
