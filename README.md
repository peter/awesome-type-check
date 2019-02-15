# awesome-type-check

A JavaScript library that provides runtime type checks / schema validation for JavaScript objects and values.

This library generates types that are on [JSON schema](https://json-schema.org/understanding-json-schema/) format and this makes the types easy to parse and generate documentation from. You can use a JSON schema validator like [ajv](https://github.com/epoberezkin/ajv) (and [ajv-keywords](https://github.com/epoberezkin/ajv-keywords)) to validate the types if you like but this library has validation logic built in (with a subset of the JSON schema rules).

This library basically provides:

* A thin layer of syntactic sugar on top of JSON schema
* Extensions to JSON schema - essentially the addition of a `validate` function - that allows us to do typeof/instanceof checks as well as any custom validation that we need for our types. JSON schema is great for validating JSON data but JSON data only has six different types (object, array, string, number, boolean, and null). In JavaScript we typically need to validate more types and this library aims to help with that.

## Use Cases for this Library

* Form and model validation
* Type checking options objects and other function arguments
* Validating types of properties passed to React components
* Ability to generate API documentation from types. Types are just JSON schema data structures with validate functions

## Installation

```
npm install awesome-type-check
```

## Usage

```javascript
const assert = require('assert').strict
const {typeErrors, TypeError, ObjectType, StringType, Enum, Required} = require('awesome-type-check')

const Username = StringType({minLength: 3, maxLength: 50, pattern: '^[a-z0-9_-]+$'})

const User = ObjectType({
    name: 'string',
    username: Required(Username),
    status: Enum(['active', 'inactive']),
    bonus: (v) => typeof v === 'number' && v > 0
})

const errors = typeErrors(User, {name: 'Joe', username: 'j', status: 'foobar'})

assert.equal(errors.length, 2)
assert(errors.every(e => e instanceof TypeError))
assert.equal(errors[0].message, 'must be at least 3 characters long but was only 1 characters')
assert.deepEqual(errors[0].path, ['username'])
assert.equal(errors[1].message, 'has value "foobar" (type string) but must be one of these values: active, inactive')
assert.deepEqual(errors[1].path, ['status'])
```

## What is a Type?

A type can be specified as:

* A string that represents a type returned by the `typeOf` function, i.e. `number`, `string`, `boolean`, `function`, `object`, `array` etc. The `typeOf` function used by this library is essentially the built-in JavaScript `typeof` with a few extensions such as `null`, `undefined`, `array`, `date`, `error`, `regexp`. A string type can also have the value `any` which will validate against all values.
* A `validate` function. The validate function can either be a predicate that returns `true` or `false` or a function that returns `undefined` or errors. If the validate function returns `true` or `undefined` then the type is considered valid and otherwise it is considered invalid. Errors are typically an array of `TypeError` objects.
* A JSON schema object that optionally contains a `validate` function

## Basic Types Represented as Strings

Here is an example of a `typeOf` type represented as a string:

```javascript
const assert = require('assert').strict
const {typeErrors, isValid} = require('awesome-type-check')
const Bonus = 'number'

assert.equal(typeErrors(Bonus, 123), undefined)
assert.equal(isValid(Bonus, 123), true)
assert.equal(typeErrors(Bonus, 'foobar')[0].message, 'must be of type number but was string')
assert.equal(isValid(Bonus, 'foobar'), false)
```

String types can be converted to JSON schema objects with `typeObject`:

```javascript
const assert = require('assert').strict
function assertEqualKeys(obj, keyValues) {
  Object.entries(keyValues).forEach(([key, value]) => assert.deepEqual(obj[key], value))
}
const {typeObject} = require('awesome-type-check')
const MyNumber = typeObject('number')

assert.equal(typeof MyNumber, 'object')
assertEqualKeys(MyNumber, {
  type: 'number',
  title: 'number',
  description: 'TypeOf(number)',
  arg: 'number'
})
assert.equal(typeof MyNumber.validate, 'function')
```

## TypeOf

Basic types with additional metadata can be created with the `TypeOf` function:

```javascript
const assert = require('assert').strict
function assertEqualKeys(obj, keyValues) {
  Object.entries(keyValues).forEach(([key, value]) => assert.deepEqual(obj[key], value))
}
const {typeErrors, isValid, TypeOf} = require('awesome-type-check')
const Bonus = TypeOf('number', {title: 'Bonus', description: 'Amount of bonus points for a user'})
assert.equal(typeErrors(Bonus, 123), undefined)
assert.equal(isValid(Bonus, 123), true)
assert.equal(typeErrors(Bonus, 'foobar')[0].message, 'must be of type number but was string')
assertEqualKeys(Bonus,
  {type: 'number',
    title: 'number',
    description: 'TypeOf(number)',
    arg: 'number'
  }
)
```

## Custom Validate Functions

Here is an example of a predicate validate function:

```javascript
const assert = require('assert').strict
const {typeErrors, isValid} = require('awesome-type-check')
const isEven = (v) => typeof v === 'number' && v % 2 === 0
assert.equal(typeErrors(isEven, 2), undefined)
assert.equal(isValid(isEven, 2), true)
assert.equal(isValid(isEven, 3), false)
```

Validate functions that are anonymous JavaScript predice functions (that return true/false) are opaque in the sense that they don't
have a name (which can be useful for documentation and errors) and they don't provide a specific/custom error message. If you need to generate
documentation from your types or if you are targeting end users you probably want your validate functions to be named
JavaScript functions (or be created with `Validate`, se below) and you want them to return a useful error message.
Here is the same type as above implemented as a validate function that returns `undefined` or errors:

```javascript
const {typeErrors, isValid, TypeError} = require('awesome-type-check')
const isEven = (v) => {
  if (typeof v === 'number' && v % 2 === 0) {
    return undefined
  } else {
    return [new TypeError(isEven, v, 'must be an even number')]
  }
}
typeErrors(isEven, 2) // => undefined
typeErrors(isEven, 3) // => [ { Error: must be an even number } ]
isValid(isEven, 2) // => true
isValid(isEven, 3) // => false
```

Here is an example of using the `Validate` function to create the same type:

```javascript
const {typeErrors, isValid, TypeError, Validate} = require('awesome-type-check')
const isEven = (v) => {
  if (typeof v === 'number' && v % 2 === 0) {
    return undefined
  } else {
    return [new TypeError(isEven, v, 'must be an even number')]
  }
}
const IsEven = Validate(isEven, {title: 'IsEven', description: 'an even number'})
typeErrors(IsEven, 2) // => undefined
typeErrors(IsEven, 3) // => [ { Error: must be an even number } ]
isValid(IsEven, 2) // => true
isValid(IsEven, 3) // => false
```

## StringType

Use `StringType` to validate string values and optionally provide `minLength`, `maxLength`, and `pattern` options:

```javascript
const {typeErrors, StringType} = require('awesome-type-check')
const Username = StringType({minLength: 3, maxLength: 50, pattern: '^[a-z0-9_-]+$'})
typeErrors(Username, 'foobar') // => undefined
typeErrors(Username, 123) // => [ { Error: must be of type StringType but was number } ]
typeErrors(Username, 'fo') // => [ { Error: must be at least 3 characters long but was only 2 characters } ]
typeErrors(Username, '!') // => [ { Error: must be at least 3 characters long but was only 1 characters }, { Error: must match pattern ^[a-z0-9_-]+$ } ]
Username
// { type: 'string',
//   title: 'StringType',
//   minLength: 3,
//   maxLength: 50,
//   pattern: '^[a-z0-9_-]+$',
//   description:
//    'String with minimum length 3 and maximum length 50 and pattern ^[a-z0-9_-]+$',
//   options: { minLength: 3, maxLength: 50, pattern: '^[a-z0-9_-]+$' },
//   validate: [Function: validate] }
```

## NumberType

Validates number values with optional `minimum` and `maximum` restrictions:

```javascript
const {typeErrors, NumberType} = require('awesome-type-check')
const Score = NumberType({minimum: 0, maximum: 100})
typeErrors(Score, 0) // => undefined
typeErrors(Score, 10) // => undefined
typeErrors(Score, 100) // => undefined
typeErrors(Score, 'foobar') // => [ { Error: must be of type NumberType but was string } ]
typeErrors(Score, -1) // => [ { Error: must be at least 0 was only -1 } ]
typeErrors(Score, 101) // => [ { Error: must be no more than 100 but was 101 } ]
Score
// { type: 'number',
//   title: 'NumberType',
//   minimum: 0,
//   maximum: 100,
//   description: 'Number with minimum length 0 and maximum length 100',
//   options: { minimum: 0, maximum: 100 },
//   validate: [Function: validate] }
```

## BoolType

Validate that a value is `true` or `false`, equivalent to `TypeOf('boolean'`:

```javascript
const {typeErrors, BoolType, TypeOf} = require('awesome-type-check')
const Active = BoolType()
typeErrors(Active, false) // => undefined
typeErrors(Active, true) // => undefined
typeErrors(Active, {}) // => [ { Error: must be of type boolean but was object } ]
typeErrors(TypeOf('boolean'), false) // => undefined
typeErrors(TypeOf('boolean'), true) // => undefined
typeErrors(TypeOf('boolean'), {}) // => [ { Error: must be of type boolean but was object } ]
Active
// { type: 'boolean',
//   title: 'boolean',
//   description: 'TypeOf(boolean)',
//   arg: 'boolean',
//   validate: [Function: validate] }
```

## NullType

Validates that a value is `null`. Equivalent to `TypeOf('null)`:

```javascript
const {typeErrors, NullType} = require('awesome-type-check')
typeErrors(NullType(), null) // => undefined
typeErrors(NullType(), undefined) // => [ { Error: must be of type null but was undefined } ]
typeErrors(NullType(), []) // => [ { Error: must be of type null but was array } ]
```

## ObjectType

## ExactObject

## ObjectOf

## ArrayType

## Enum

## InstanceOf

## Required

## AllOf

## AnyOf

## TODO

* TypeOf arg should be string or array
* ESLint
* Add error toJSON test (i.e. check JSON.parse(JSON.stringify(error)))
* Improve assertValidOptions usage - introduce SHARED_OPTIONS ({isRequired}) and default additionalKeys to false
* Add ajv schema validation to nested type test
* Improve generic message if you can extract title
* Create single ES5/UMD file with Babel/Rollup for client side use?
* Create a JSFiddle with unpkg (https://medium.com/cameron-nokes/the-30-second-guide-to-publishing-a-typescript-package-to-npm-89d93ff7bccd)
* Test ability to easily generate documentation etc. based on a nested complex type (good navigability and meta data)
* More test cases: Enum, nested objects/arrays, AnyOf, AllOf, custom types, optional arrays (ArrayOrScalar)
* More syntactic sugar for string types: 'string|number!'
* Integration with React when used as PropTypes. Ability to turn off in production. PropTypes compatibility layer?
* Apply to the assertValidOptions use case
* Tuple type (Array with items array and minLength/maxLenth?)

## Resources

* [superstruct - Data Validation](https://github.com/ianstormtaylor/superstruct). It seems superstruct only reports on the first key having an error, not all keys. This may be an issue for form validation.
* [joi - Object Schema Validation](https://github.com/hapijs/joi)
* [facebook/prop-types - Type Checking React Props](https://github.com/facebook/prop-types)
* [type_spec - Runtime Type Checks in Python](https://github.com/peter/type_spec)
* [Understanding JSON Schema](https://json-schema.org/understanding-json-schema)
* [kind-of - Check Type of Value in JavaScript](https://github.com/jonschlinkert/kind-of)
* [Clojure Spec](https://clojure.org/guides/spec)
* [Active Record Validations](https://guides.rubyonrails.org/active_record_validations.html)
