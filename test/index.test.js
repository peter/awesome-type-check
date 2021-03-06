const Ajv = require('ajv')
const ajv = new Ajv()
const {mapObj} = require('../src/util')
const TypeError = require('../src/type_error')
const {typeErrors, ObjectType, NestedObject, ArrayType, ExactObject, InstanceOf, ObjectOf, Validate, StringType, Enum, TypeOf, Required, AllOf, AnyOf} = require('../src/index')

function validateSchema (schema, data) {
  ajv.validate(schema, data)
  return ajv.errors
}

function assertSchema (schema, data) {
  const ajvErrors = validateSchema(schema, data)
  if (ajvErrors) {
    console.log('assertSchema errors', ajvErrors)
    const error = new Error('assertSchema errors')
    error.ajvErrors = ajvErrors
    error.schema = schema
    error.data = data
    throw error
  }
}

function expectObjectErrors (type, value, expectedErrorMessages) {
  const errors = typeErrors(type, value)
  const actualErrorMessages = errors.reduce((acc, error) => {
    acc[error.path[0]] = error.message
    return acc
  }, {})
  expect(actualErrorMessages).toEqual(expectedErrorMessages)
  expect(errors.every(e => e instanceof TypeError))
  expect(errors.every(e => e.value === value))
  expect(errors.every(e => e.type === type[e.path[0]]))
}

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

  assertSchema(User, {})

  expect(typeErrors(User, {})).toEqual(undefined)

  expect(typeErrors(User, {foo: 1})).toEqual(undefined)

  expect(typeErrors(User, {name: 'Joe', username: 'foobar', status: 'active'})).toEqual(undefined)

  expect(typeErrors(User, {name: 'Joe', username: 'foobar', status: 'active', bonus: 1})).toEqual(undefined)

  expectObjectErrors(User, {name: 'Joe', username: 'foobar', status: 'active', bonus: 0}, {
    bonus: 'is invalid'
  })

  expectObjectErrors(User, {name: 'Joe', username: null, status: 'active'}, {
    username: 'must be of type StringType but was null'
  })

  expectObjectErrors(User, {name: 'Joe', username: 'j', status: 'foobar'}, {
    status: 'must be one of: active, inactive',
    username: 'must have at least 3 characters but had only 1'
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

  expect(typeErrors(User, {}).map(e => e.message)).toEqual(['is missing the following required keys: username, status'])

  expect(typeErrors(User, {foo: 1}).map(e => e.message)).toEqual(['is missing the following required keys: username, status'])

  expect(typeErrors(User, {name: 'Joe', username: 'foobar'}).map(e => e.message)).toEqual(['is missing the following required keys: status'])

  const validUser = {name: 'Joe', username: 'foobar', status: 'active'}
  expect(typeErrors(User, validUser)).toEqual(undefined)

  assertSchema(User, validUser)
})

test('ObjectType - complains about missing keys marked as required', () => {
  const User = ObjectType(
    {
      name: TypeOf('string', {isRequired: true}),
      username: Required(Username),
      status: Enum(['active', 'inactive']),
      foobar: 'boolean'
    },
    {
      required: ['status']
    }
  )

  expect(typeErrors(User, {}).map(e => e.message)).toEqual(['is missing the following required keys: status, name, username'])
  expect(typeErrors(User, {foo: 1}).map(e => e.message)).toEqual(['is missing the following required keys: status, name, username'])

  expect(typeErrors(User, {name: 'Joe', username: 'foobar'}).map(e => e.message)).toEqual(['is missing the following required keys: status'])

  const validUser = {name: 'Joe', username: 'foobar', status: 'active'}
  expect(typeErrors(User, validUser)).toEqual(undefined)

  assertSchema(User, validUser)
})

test('ObjectType - complains about invalid keys with additionalProperties: false', () => {
  const User = ExactObject(
    {
      name: 'string',
      username: Username,
      status: Enum(['active', 'inactive'])
    }
  )

  assertSchema(User, {})

  expect(typeErrors(User, {})).toEqual(undefined)

  expect(typeErrors(User, {foo: 1}).map(e => e.message)).toEqual(['has the following invalid keys: foo'])

  expect(typeErrors(User, {name: 'Joe', username: 'foobar', status: 'active', bar: true}).map(e => e.message)).toEqual(['has the following invalid keys: bar'])
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

  assertSchema(Users, {})

  expect(typeErrors(Users, {})).toEqual(undefined)

  expectObjectErrors(Users, {foo: 1}, {'foo': 'must be of type User (object) but was number'})
})

test('we can get good error metadata (type/value/path) from nested data structures (objects/arrays)', () => {
  const NestedData = ObjectType({
    name: Required('string'),
    topLevelNumbers: ArrayType('number'),
    foo: ObjectType({
      bar: ArrayType(ObjectType({
        baz: 'boolean'
      }))
    })
  })

  expect(typeErrors(NestedData, {name: 'joe'})).toEqual(undefined)
  assertSchema(NestedData, {name: 'joe'})

  const topLevelErrors = typeErrors(NestedData, {})
  expect(topLevelErrors.length).toEqual(1)
  expect(topLevelErrors[0].type).toEqual(NestedData)
  expect(topLevelErrors[0].value).toEqual({})
  expect(topLevelErrors[0].path).toEqual(undefined)
  expect(topLevelErrors[0].code).toEqual('required')
  expect(topLevelErrors[0].message).toEqual('is missing the following required keys: name')

  const keyErrors = typeErrors(NestedData, {name: 123})
  expect(keyErrors.length).toEqual(1)
  expect(keyErrors[0].type).toEqual(NestedData.properties.name)
  expect(keyErrors[0].value).toEqual(123)
  expect(keyErrors[0].path).toEqual(['name'])
  expect(keyErrors[0].code).toEqual('typeof')
  expect(keyErrors[0].message).toEqual('must be of type string but was number')

  const arrayErrors = typeErrors(NestedData, {name: 'joe', topLevelNumbers: ['foo', 1, 'bar']})
  expect(arrayErrors.length).toEqual(2)
  expect(arrayErrors[0].type).toEqual(NestedData.properties.topLevelNumbers.items)
  expect(arrayErrors[0].value).toEqual('foo')
  expect(arrayErrors[0].path).toEqual(['topLevelNumbers', 0])
  expect(arrayErrors[0].code).toEqual('typeof')
  expect(arrayErrors[0].message).toEqual('must be of type number but was string')

  expect(arrayErrors[1].type).toEqual(NestedData.properties.topLevelNumbers.items)
  expect(arrayErrors[1].value).toEqual('bar')
  expect(arrayErrors[1].path).toEqual(['topLevelNumbers', 2])
  expect(arrayErrors[1].code).toEqual('typeof')
  expect(arrayErrors[1].message).toEqual('must be of type number but was string')

  const nestedErrors = typeErrors(NestedData, {name: 'joe', foo: {bar: [{baz: 123}]}})
  expect(nestedErrors.length).toEqual(1)
  expect(nestedErrors[0].type).toEqual(NestedData.properties.foo.properties.bar.items.properties.baz)
  expect(nestedErrors[0].path).toEqual(['foo', 'bar', 0, 'baz'])
  expect(nestedErrors[0].code).toEqual('typeof')
  expect(nestedErrors[0].message).toEqual('must be of type boolean but was number')

  const multipleErrors = typeErrors(NestedData, {name: 123, topLevelNumbers: {}, foo: {bar: [{baz: 123}]}})
  expect(multipleErrors.length).toEqual(3)
  expect(multipleErrors.map(e => e.path.join('.')).sort()).toEqual(['foo.bar.0.baz', 'name', 'topLevelNumbers'])
})

test('NestedObject - provides syntactic sugar over ObjectType for nested data', () => {
  const NestedData = NestedObject({
    name: 'string!',
    topLevelNumbers: ArrayType('number', {title: 'Awesome Number', maxItems: 2}),
    foo: {
      bar: [{
        baz: 'boolean!',
        boo: StringType({maxLength: 3})
      }]
    }
  })

  expect(typeErrors(NestedData, {name: 'joe'})).toEqual(undefined)
  expect(typeErrors(NestedData, {name: 'joe', topLevelNumbers: [1, 2], foo: {bar: [{baz: true}]}})).toEqual(undefined)
  expect(typeErrors(NestedData, {name: 'joe', topLevelNumbers: [1, 2], foo: {bar: [{baz: true, boo: 'abc'}]}})).toEqual(undefined)

  const topLevelErrors = typeErrors(NestedData, {})
  expect(topLevelErrors.length).toEqual(1)
  expect(topLevelErrors[0].type).toEqual(NestedData)
  expect(topLevelErrors[0].value).toEqual({})
  expect(topLevelErrors[0].path).toEqual(undefined)
  expect(topLevelErrors[0].code).toEqual('required')
  expect(topLevelErrors[0].message).toEqual('is missing the following required keys: name')

  let invalidData = {name: 'joe', topLevelNumbers: [1, 2], foo: {bar: [{baz: true, boo: 'abcd'}]}}
  expect(typeErrors(NestedData, invalidData)[0].message).toEqual('must have at most 3 characters but had 4')

  invalidData = {name: 'joe', topLevelNumbers: [1, 2], foo: {bar: [{}]}}
  expect(typeErrors(NestedData, invalidData)[0].message).toEqual('is missing the following required keys: baz')

  invalidData = {name: 'joe', topLevelNumbers: [1, 2], foo: 'foo'}
  expect(typeErrors(NestedData, invalidData)[0].message).toEqual('must be of type ObjectType but was string')

  invalidData = {name: 'joe', topLevelNumbers: [1, 2], foo: {bar: 'bar'}}
  expect(typeErrors(NestedData, invalidData)[0].message).toEqual('must be of type ArrayType but was string')

  invalidData = {name: 'joe', topLevelNumbers: [1, 2, 3]}
  expect(typeErrors(NestedData, invalidData)[0].message).toEqual('must have no more than 2 items but had 3')
})

test('typeErrors - validates schema object type property', () => {
  const schema = {type: ['string', 'number', 'boolean']}
  expect(typeErrors(schema, 'foobar')).toEqual(undefined)
  expect(typeErrors(schema, 123)).toEqual(undefined)
  expect(typeErrors(schema, false)).toEqual(undefined)
  expect(typeErrors(schema, []).map(e => e.message)).toEqual(['must be of type string|number|boolean but was array'])

  expect(typeErrors({type: 'array'}, [])).toEqual(undefined)
})

test('ArrayType - validates as JSON schema', () => {
  const MyArray = ArrayType('number|boolean', {maxItems: 2})
  expect(MyArray.items.type).toEqual(['number', 'boolean'])
  assertSchema(MyArray, [])
  expect(validateSchema(MyArray, ['foobar'])[0].message).toEqual('should be number,boolean')
  expect(validateSchema(MyArray, [1, 2, 3])[0].message).toEqual('should NOT have more than 2 items')
})

test('ArrayType - complains about unrecognized options', () => {
  expect(() => ArrayType('number', {minLength: 10})).toThrowError(/unrecognized options key/i)
})

test('ArrayType - accepts options minItems, maxItems, title, description, isRequired', () => {
  const options = {minItems: 1, maxItems: 3, title: 'Tags', description: 'User tags', isRequired: true}
  const User = ObjectType({
    tags: ArrayType('string', options)
  })
  expect(User.name).toEqual('ObjectType')
  expect(User.properties.tags.name).toEqual('ArrayType')
  expect(User.properties.tags.title).toEqual(options.title)
  expect(User.properties.tags.description).toEqual(options.description)
  expect(User.properties.tags.minItems).toEqual(options.minItems)
  expect(User.properties.tags.maxItems).toEqual(options.maxItems)
  expect(typeErrors(User, {tags: ['foobar']})).toEqual(undefined)
  expect(validateSchema(User, {tags: ['foobar']})).toEqual(null)
})

test('Types that take a required argument will throw error if not provided', () => {
  expect(() => Enum()).toThrowError(/Enum expects a non empty array/)
  expect(() => InstanceOf()).toThrowError(/InstanceOf expects/)
  expect(() => TypeOf()).toThrowError(/TypeOf expects/)
  expect(() => Validate()).toThrowError(/Validate expects/)
  expect(() => AllOf()).toThrowError(/AllOf expects/)
  expect(() => AnyOf()).toThrowError(/AnyOf expects/)
})
