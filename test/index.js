const {typeError, ObjectType, StringType, Enum} = require('../src/index')

const Username = StringType({minLength: 3, maxLength: 50, pattern: /^[a-z0-9_-]+$/})

const User = ObjectType(
  {
    name: 'string',
    username: Username,
    status: Enum('active', 'inactive')
  },
  {requiredKeys: ['username']}
)

const error = typeError(User, {name: 'Joe', username: 'j', status: 'foobar'})

if (error) {
  console.log('user is not valid, error:', error)
} else {
  console.log('user is valid')
}
