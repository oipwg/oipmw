const CryptoJS = require('crypto-js')
const Wallet = require('./wallet')

test('wallet constructor', () => {
  let wal = new Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')
  expect(wal.identifier).toBe('75c1209-dbcac5a6-e040977-64a52ae')
  expect(wal.password).toBe('PublicDevAccount')
})

test('wallet load promise', () => {
  expect.assertions(4)

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
  expect.assertions(4)

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
  expect.assertions(2)

  let wal = new Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  return wal.load().then(() => {
    return wal.refreshBalances().then(() => {
      expect(wal).toBeDefined()
      expect(wal.keys[0].coins['florincoin'].balance).toBe(999700000)
    })
  })
})

test('wallet refresh balance callback', (done) => {
  jest.setTimeout(30 * 1000)
  expect.assertions(2)

  let wal = new Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  wal.load(() => {
    wal.refreshBalances(() => {
      expect(wal).toBeDefined()
      expect(wal.keys[0].coins['florincoin'].balance).toBe(999700000)
      done()
    })
  })
})
