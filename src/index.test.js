const {typeError, ObjectType, ExactObject, StringType, Enum, TypeOf, Required} = require('./index')

test('ObjectType without options - checks types of keys, keys are optional, additional keys allowed', () => {
  const Username = StringType({minLength: 3, maxLength: 50, pattern: /^[a-z0-9_-]+$/})
  const User = ObjectType(
    {
      name: 'string',
      username: Username,
      status: Enum(['active', 'inactive'])
    }
  )

  expect(typeError(User, {})).toEqual(undefined)

  expect(typeError(User, {foo: 1})).toEqual(undefined)

  expect(typeError(User, {name: 'Joe', username: 'foobar', status: 'active'})).toEqual(undefined)

  expect(typeError(User, {name: 'Joe', username: null, status: 'active'})).toEqual({
    username: 'must be of type string but was null'
  })

  expect(typeError(User, {name: 'Joe', username: 'j', status: 'foobar'})).toEqual({
    status: 'has value "foobar" (type string) but must be one of these values: active, inactive',
    username: 'must be at least 3 characters long but was only 1 characters'
  })
})

test('ObjectType - complains about missing keys given required option', () => {
  const Username = StringType({minLength: 3, maxLength: 50, pattern: /^[a-z0-9_-]+$/})
  const User = ObjectType(
    {
      name: 'string',
      username: Username,
      status: Enum(['active', 'inactive'])
    },
    {
      required: ['username', 'status']
    }
  )

  expect(typeError(User, {})).toEqual('is missing the following required keys: username, status')

  expect(typeError(User, {foo: 1})).toEqual('is missing the following required keys: username, status')

  expect(typeError(User, {name: 'Joe', username: 'foobar'})).toEqual('is missing the following required keys: status')

  expect(typeError(User, {name: 'Joe', username: 'foobar', status: 'active'})).toEqual(undefined)
})

test('ObjectType - complains about missing keys marked as required', () => {
  const Username = StringType({minLength: 3, maxLength: 50, pattern: /^[a-z0-9_-]+$/})
  const User = ObjectType(
    {
      name: TypeOf('string', {required: true}),
      username: Required(Username),
      status: Enum(['active', 'inactive']),
      foobar: 'boolean'
    },
    {
      required: ['status']
    }
  )

  expect(typeError(User, {})).toEqual('is missing the following required keys: status, name, username')
  expect(typeError(User, {foo: 1})).toEqual('is missing the following required keys: status, name, username')

  expect(typeError(User, {name: 'Joe', username: 'foobar'})).toEqual('is missing the following required keys: status')

  expect(typeError(User, {name: 'Joe', username: 'foobar', status: 'active'})).toEqual(undefined)
})

test('ObjectType - complains about invalid keys with additionalProperties: false', () => {
  const Username = StringType({minLength: 3, maxLength: 50, pattern: /^[a-z0-9_-]+$/})
  const User = ExactObject(
    {
      name: 'string',
      username: Username,
      status: Enum(['active', 'inactive'])
    }
  )

  expect(typeError(User, {})).toEqual(undefined)

  expect(typeError(User, {foo: 1})).toEqual('has the following invalid keys: foo')

  expect(typeError(User, {name: 'Joe', username: 'foobar', status: 'active', bar: true})).toEqual('has the following invalid keys: bar')
})
