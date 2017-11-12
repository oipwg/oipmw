const flovault = require('./flovault')

test('isValidIdentifier', () => {
  expect(flovault.isValidIdentifier('75c1209-dbcac5a6-e040977-64a52ae')).toBe(true)
  expect(flovault.isValidIdentifier('75R1209-dbcac5a6-e040977-64a52ae')).toBe(false)
  expect(flovault.isValidIdentifier('75c1209-dbcac5a6-e040977-64a52ae-')).toBe(false)
  expect(flovault.isValidIdentifier('75c1209')).toBe(false)
})

// ToDo: Mock the http calls to force situations to test
// https://facebook.github.io/jest/docs/en/mock-functions.html

test('checkLoad', () => {
  return flovault.checkLoad('75c1209-dbcac5a6-e040977-64a52ae').then((res) => {
    expect(res).toBeDefined()
    expect(res.error).toBeUndefined()
    expect(res.auth_key_isvalid).toBe(true)
  })
})

let b64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
test('load', () => {
  return flovault.load('75c1209-dbcac5a6-e040977-64a52ae').then((res) => {
    expect(res).toBeDefined()
    expect(res.error).toBe(false)
    // wallet is a base64 string
    expect(b64.test(res.wallet)).toBe(true)
  })
})

test('read_account', () => {
  return flovault.readAccount('75c1209-dbcac5a6-e040977-64a52ae',
    '3944a2806982d40eab55068df19328b3f06f0bce924989099a2cfc21769cc72d91200da16b79a5c6145721e9d2543924').then((res) => {
      expect(res).toBeDefined()
      expect(res.email).toBe('publicdevaccount-flovault@bitspill.net')
    })
})
