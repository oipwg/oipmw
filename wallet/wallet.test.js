const CryptoJS = require('crypto-js')
const Wallet = require('./wallet')

test('wallet constructor', () => {
  let wal = new Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')
  expect(wal.identifier).toBe('75c1209-dbcac5a6-e040977-64a52ae')
  expect(wal.password).toBe('PublicDevAccount')
})

test('wallet load promise', () => {
  expect.hasAssertions()

  let wal = new Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  return wal.load().then(() => {
    expect(wal.identifier).toBe('75c1209-dbcac5a6-e040977-64a52ae')
    expect(wal.password).toBe('PublicDevAccount')
    expect(wal.defaultCrypto).toBe('florincoin')
    expect(wal.cryptoConfig).toEqual({
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Iso10126,
      iterations: 5
    })
  })
})

test('wallet load callback', (done) => {
  expect.hasAssertions()

  let wal = new Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  wal.load(() => {
    expect(wal.identifier).toBe('75c1209-dbcac5a6-e040977-64a52ae')
    expect(wal.password).toBe('PublicDevAccount')
    expect(wal.defaultCrypto).toBe('florincoin')
    expect(wal.cryptoConfig).toEqual({
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Iso10126,
      iterations: 5
    })
    done()
  })
})

test('wallet refresh balance promise', () => {
  jest.setTimeout(30 * 1000)
  expect.hasAssertions()

  let wal = new Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  return wal.load().then(() => {
    return wal.refreshBalances().then(() => {
      expect(wal).toBeDefined()
      expect(wal.keys[0].coins['florincoin'].balanceSat).toBe(899600000)
    })
  })
})

test('wallet refresh balance callback', (done) => {
  jest.setTimeout(30 * 1000)
  expect.hasAssertions()

  let wal = new Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  wal.load(() => {
    wal.refreshBalances(() => {
      expect(wal.keys[0].coins['florincoin'].balanceSat).toBe(899600000)
      done()
    })
  })
})

test('wallet refresh promise', () => {
  jest.setTimeout(60 * 1000)
  expect.hasAssertions()

  let wal = new Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  return wal.load().then(() => {
    return wal.refresh().then(() => {
      expect(wal.keys[0].getBalanceSat('florincoin')).toBe(899600000)
      expect(wal.keys[0].getBalanceSat('bitcoin_testnet')).toBe(223726225)
      expect(wal.keys[0].getUTXO('florincoin')).toEqual([{
        'address': 'FDEAciuFexEHy1kiLKRt34e2PybTyhdGZC',
        'amount': 8.996,
        'satoshis': 899600000,
        'confirmations': 6,
        'confirmationsFromCache': true,
        'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
        'ts': 1510069808,
        'txid': 'cdf9581d413286dc1c6ccb7d2b0ca105879c29932364668d579ed2621dffe60a',
        'vout': 1
      }])
      expect(wal.keys[0].getUTXO('bitcoin_testnet').length).toBe(3)
    })
  })
})

test('wallet refresh callback', (done) => {
  jest.setTimeout(60 * 1000)
  expect.hasAssertions()

  let wal = new Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  return wal.load(() => {
    return wal.refresh(() => {
      expect(wal.keys[0].getBalanceSat('florincoin')).toBe(899600000)
      expect(wal.keys[0].getUTXO('florincoin')).toEqual([{
        'address': 'FDEAciuFexEHy1kiLKRt34e2PybTyhdGZC',
        'amount': 8.996,
        'satoshis': 899600000,
        'confirmations': 6,
        'confirmationsFromCache': true,
        'scriptPubKey': '76a9145125148dc7f01494071bfe3bf3afc7c612e0bd5388ac',
        'ts': 1510069808,
        'txid': 'cdf9581d413286dc1c6ccb7d2b0ca105879c29932364668d579ed2621dffe60a',
        'vout': 1
      }])
      done()
    })
  })
})
