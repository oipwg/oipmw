function prepareCallback (callback) {
  if (!(callback instanceof Function)) {
    callback = function () {}
  }
  return callback
}

module.exports = prepareCallback

// ToDo: create wrappers that return promises to resolve/reject and calls the callback
/*
function prepare (callback) {
  if (!(callback instanceof Function)) {
    callback = function () {}
  }
  return callback
}

function resolve (data) {
  callback(data)
  return Promise.resolve(data)
}

function reject (data) {
  callback(data)
  return Promise.reject(data)
}

module.exports = {
  prepare: prepare,
  reject: reject,
  resolve: resolve
}
*/
