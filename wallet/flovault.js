const axios = require('axios')
const callbackify = require('callbackify')

let ax = axios.create({
  baseURL: 'https://flovault.alexandria.io/wallet/'
})

function checkLoad (identifier) {
  if (!isValidIdentifier(identifier)) {
    let ret = {
      error: 'malformed identifier',
      message: 'malformed identifier'
    }
    return Promise.reject(ret)
  }

  return ax.get('checkload/' + identifier)
    .then(function (response) {
      let data = response.data

      if (data.error) {
        return Promise.reject(data.error)
      }

      if (data.auth_key_isvalid === true) {
        return Promise.resolve(data)
      }

      return Promise.reject(data)
    })
    .catch(function (error) {
      let ret = {
        error: error,
        message: 'checkload request failed'
      }
      return Promise.reject(ret)
    })
}

function load (identifier) {
  if (!isValidIdentifier(identifier)) {
    let ret = {
      error: 'malformed identifier',
      message: 'malformed identifier'
    }
    return Promise.reject(ret)
  }

  return ax.get('load/' + identifier)
    .then(function (response) {
      let data = response.data

      if (data.error !== false) {
        return Promise.reject(data.error)
      }

      return Promise.resolve(data)
    })
    .catch(function (error) {
      let ret = {
        error: error,
        message: 'load request failed'
      }
      return Promise.reject(ret)
    })
}

function readAccount (identifier, sharedKey) {
  if (!isValidIdentifier(identifier)) {
    let ret = {
      error: 'malformed identifier',
      message: 'malformed identifier'
    }
    return Promise.reject(ret)
  }
  if (!isValidSharedKey(sharedKey)) {
    let ret = {
      error: 'malformed sharedKey',
      message: 'malformed sharedKey'
    }
    return Promise.reject(ret)
  }

  return ax.post('read_account/', {identifier: identifier, shared_key: sharedKey})
    .then(function (response) {
      let data = response.data

      if (data.error !== false) {
        return Promise.reject(data)
      }
      return Promise.resolve(data.data)
    })
    .catch(function (error) {
      let ret = {
        error: error,
        message: 'read_account request failed'
      }
      return Promise.reject(ret)
    })
}

function isValidIdentifier (identifier) {
  // for example 75c1209-dbcac5a6-e040977-64a52ae
  return /^[0-9a-f]{7}-[0-9a-f]{8}-[0-9a-f]{7}-[0-9a-f]{7}$/.test(identifier)
}

function isValidSharedKey (sharedKey) {
  // for example 3944a2806982d40eab55068df19328b3f06f0bce924989099a2cfc21769cc72d91200da16b79a5c6145721e9d2543924
  return /^[0-9a-f]+$/.test(sharedKey)
}

module.exports = {
  checkLoad: callbackify(checkLoad),
  load: callbackify(load),
  readAccount: callbackify(readAccount),
  isValidIdentifier: callbackify(isValidIdentifier)
}
