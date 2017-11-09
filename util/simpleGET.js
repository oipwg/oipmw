const axios = require('axios')
const callbackify = require('callbackify')

let ax = axios.create()

function simpleGET (url, params) {
  return ax.get(url, {params: params}).then((res) => Promise.resolve(res.data))
}

module.exports = callbackify(simpleGET)
