const {typeError, ObjectType, ExactObject, ObjectOf, StringType, Enum, TypeOf, Required} = require('./index')

const Username = StringType({minLength: 3, maxLength: 50, pattern: '^[a-z0-9_-]+$'})

test('ObjectType without options - checks types of keys, keys are optional, additional keys allowed', () => {
  const User = ObjectType(
    {
      name: 'string',
      username: Username,
      status: Enum(['active', 'inactive']),
      bonus: (v) => typeof v === 'number' && v > 0
    }
  )

  expect(typeError(User, {})).toEqual(undefined)

  expect(typeError(User, {foo: 1})).toEqual(undefined)

  expect(typeError(User, {name: 'Joe', username: 'foobar', status: 'active'})).toEqual(undefined)

  expect(typeError(User, {name: 'Joe', username: 'foobar', status: 'active', bonus: 1})).toEqual(undefined)

  expect(typeError(User, {name: 'Joe', username: 'foobar', status: 'active', bonus: 0})).toEqual({
    bonus: 'is invalid'
  })

  expect(typeError(User, {name: 'Joe', username: null, status: 'active'})).toEqual({
    username: 'must be of type string but was null'
  })

  expect(typeError(User, {name: 'Joe', username: 'j', status: 'foobar'})).toEqual({
    status: 'has value "foobar" (type string) but must be one of these values: active, inactive',
    username: 'must be at least 3 characters long but was only 1 characters'
  })
})

test('ObjectType - complains about missing keys given required option', () => {
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

test('ObjectOf - can specify an object with a certain value type (via patternProperties)', () => {
  const User = ExactObject(
    {
      name: 'string',
      username: Username,
      status: Enum(['active', 'inactive'])
    },
    {title: 'User'}
  )
  const Users = ObjectOf(User)

  expect(typeError(Users, {})).toEqual(undefined)

  expect(typeError(Users, {foo: 1})).toEqual({'foo': 'must be of type User (ObjectType) but was number'})
})
