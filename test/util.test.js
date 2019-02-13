const {assertValidOptions} = require('../dist/util')

test('assertValidOptions - can check all types supported by the typeOf function', () => {
  const validOptions = {
    foo: 'string',
    bar: 'number',
    baz: 'function',
    bla: ['boolean']
  }
  assertValidOptions({}, validOptions)
  assertValidOptions({foo: 'foo'}, validOptions)
  assertValidOptions({foo: 'foo', bar: 1, baz: function () {}, bla: [true, false]}, validOptions)
  assertValidOptions({foo: 'foo', bar: 1, baz: function () {}, bla: []}, validOptions)

  expect(() => assertValidOptions({foo: 'foo', bar: 1, baz: function () {}, bla: ['bla']}, validOptions)).toThrow()
})
