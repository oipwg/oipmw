const prepareCallback = require('../../util').prepareCallback

function Insight (url) {
  if (!(this instanceof Insight)) {
    console.warn('Non constructor call made to Insight.constructor')
    return new Insight(...arguments)
  }

  this.url = url
}

Insight.prototype.load = function (callback) {
  callback = prepareCallback(callback)

  return null
}

module.exports = Insight
