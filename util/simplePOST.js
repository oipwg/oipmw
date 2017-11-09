const axios = require('axios')
const prepareCallback = require('./prepareCallback')

let ax = axios.create()
ax.defaults.validateStatus = function (status) {
  return (status >= 200 && status < 300) || status === 400
}

function simplePOST (url, data, callback) {
  callback = prepareCallback(callback)

  return ax.post(url, data)
    .then(function (res) {
      callback(null, res.data)
      return Promise.resolve(res.data)
    }).catch(function (res) {
      callback(res, null)
      return Promise.reject(res)
    })
}

module.exports = simplePOST
