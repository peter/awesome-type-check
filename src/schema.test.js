const {validate} = require('./schema')

test('can use instanceof keyword recognize instances of classes like Error, RegExp, Date etc.', () => {
  expect(validate({instanceof: 'RegExp'}, /foobar/)).toEqual(undefined)
  expect(validate({instanceof: 'RegExp'}, 'foobar')[0].keyword).toEqual('instanceof')

  expect(validate({instanceof: 'Error'}, new Error('foobar'))).toEqual(undefined)
  expect(validate({instanceof: 'Error'}, null)[0].keyword).toEqual('instanceof')

  expect(validate({instanceof: 'Date'}, new Date())).toEqual(undefined)
  expect(validate({instanceof: 'Date'}, null)[0].keyword).toEqual('instanceof')
})

test('can use typeof to recognize a function', () => {
  expect(validate({typeof: 'function'}, function () {})).toEqual(undefined)
  expect(validate({typeof: 'function'}, 'foobar')[0].keyword).toEqual('typeof')
})
