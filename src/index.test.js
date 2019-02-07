const {typeError, ObjectType, StringType, Enum} = require('./index')

test('ObjectType - checks type of keys', () => {
  const Username = StringType({minLength: 3, maxLength: 50, pattern: /^[a-z0-9_-]+$/})
  const User = ObjectType(
    {
      name: 'string',
      username: Username,
      status: Enum('active', 'inactive')
    }
  )

  expect(typeError(User, {name: 'Joe', username: 'j', status: 'foobar'})).toEqual({
    status: 'has value "foobar" (type string) but must be one of these values: active, inactive',
    username: 'must be at least 3 characters long but was only 1 characters'
  })

  expect(typeError(User, {username: 'foobar', status: 'active'})).toEqual({
    name: 'must be of type string but was undefined',
  })
})

test('ObjectType - complains about missing requiredKeys', () => {})

test('ObjectType - complains about invalid keys with additionalKeys: true', () => {})
