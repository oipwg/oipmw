const axios = require('axios')
const prepareCallback = require('./prepareCallback')

let ax = axios.create()

function simpleGET (url, params, callback) {
  callback = prepareCallback(callback)

  if (params instanceof Function) {
    callback = params
    params = {}
  }

  return ax.get(url, {params: params})
    .then(function (res) {
      callback(null, res)
      return Promise.resolve(res.data)
    }).catch(function (res) {
      callback(res, null)
      return Promise.reject(res)
    })
}

module.exports = simpleGET
