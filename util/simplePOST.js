const axios = require('axios')
const prepareCallback = require('./prepareCallback')

let ax = axios.create()

function simplePOST (url, data, callback) {
  let cb = prepareCallback(callback)

  return ax.post(url, data)
    .then(res => {
      cb(null, res)
      return Promise.resolve(res)
    })
    .catch(res => {
      cb(res)
      return Promise.reject(res)
    })
}

module.exports = simplePOST
