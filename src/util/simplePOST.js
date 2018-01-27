const axios = require('axios')
const callbackify = require('callbackify')

let ax = axios.create()

function simplePOST (url, data) {
  return ax.post(url, data).then((res) => Promise.resolve(res.data))
}

module.exports = callbackify(simplePOST)
