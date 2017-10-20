const prepareCallback = require('./prepareCallback')

test('prepareCallback', () => {
  let cb = prepareCallback(function () { return 'yo' })
  expect(cb).toBeInstanceOf(Function)
  expect(cb()).toBe('yo')

  expect(prepareCallback()).toBeInstanceOf(Function)
  expect(prepareCallback()()).toBeUndefined()
  expect(prepareCallback('hi')).toBeInstanceOf(Function)
  expect(prepareCallback('hi')()).toBeUndefined()
})
