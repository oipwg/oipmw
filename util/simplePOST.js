const axios = require('axios')
const callbackify = require('callbackify')

let ax = axios.create()
ax.defaults.validateStatus = function (status) {
  return (status >= 200 && status < 300) || status === 400
}

function simplePOST (url, data) {
  return ax.post(url, data).then((res) => Promise.resolve(res.data))
}

module.exports = callbackify(simplePOST)
