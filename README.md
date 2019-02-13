# awesome-type-check

A JavaScript library that provides runtime type checks / schema validation for JavaScript objects and values.

This library generates types that are on [JSON schema](https://json-schema.org/understanding-json-schema/) format and this makes the types easy to parse and generate documentation from. You can use a JSON schema validator like [ajv](https://github.com/epoberezkin/ajv) (and [ajv-keywords](https://github.com/epoberezkin/ajv-keywords)) to validate the types if you like but this library has validation logic built in (with a subset of the JSON schema rules).

This library basically provides:

* A thin layer of functions with syntactic sugar on top of JSON schema
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
const {typeErrors, ObjectType, StringType, Enum, Required} = require('awesome-type-check')

const Username = StringType({minLength: 3, maxLength: 50, pattern: '^[a-z0-9_-]+$'})

const User = ObjectType({
    name: 'string',
    username: Required(Username),
    status: Enum(['active', 'inactive']),
    bonus: (v) => typeof v === 'number' && v > 0
})

const errors = typeErrors(User, {name: 'Joe', username: 'j', status: 'foobar'})

if (errors) {
  console.log('user is not valid, errors:', errors)
} else {
  console.log('user is valid')
}
```

## What is a Type?

A type can be specified as:

* A string that represents a type returned by the `typeOf` function, i.e. `number`, `string`, `boolean`, `function`, `object`, `array` etc.
* A validate function. The validate function can either be a predicate that returns `true` or `false` or a function that returns `undefined` or errors. If the validate function returns `true` or `undefined` then the type is considered valid and otherwise it is considered invalid. Errors are typically an array of `TypeError` objects.
* A JSON schema object that optionally contains a validate function

Here is an example of a type represented as a string:

```javascript
const {typeErrors} = require('awesome-type-check')
const myType = 'number'
typeErrors(myType, 123) // => undefined
typeErrors(myType, 'foobar') // => [ { Error: value "foobar" (type string) must be of type number } ]
```

String types can be converted to JSON schema objects with `typeObject`:

```javascript
const {typeObject} = require('awesome-type-check')
typeObject('number')
// => { type: 'number',
//      title: 'TypeOf',
//      arg: 'number',
//      validate: [Function: validate] }
```

Here is an example of a predicate validate function:

```javascript
const {typeErrors, isValid} = require('awesome-type-check')
const isEven = (v) => typeof v === 'number' && v % 2 === 0
typeErrors(isEven, 2) // => undefined
isValid(isEven, 2) // => true
isValid(isEven, 3) // => false
```

Here is the same function as a validate function that returns `undefined` or errors:

```javascript
const {typeErrors, TypeError} = require('awesome-type-check')
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

## TODO

* Test errors in nested types: object - array - object
* Test ability to easily generate documentation etc. based on a nested complex type (good navigability and meta data)
* More test cases: Enum, nested objects/arrays, AnyOf, AllOf, custom types, optional arrays (ArrayOrScalar)
* More syntactic sugar for string types: 'string|number!'

* Need to fix required option to not have two conflicting meanings

* Integration with React when used as PropTypes. Ability to turn off in production
* PropTypes compatibility layer?

* Create a JSFiddle with unpkg

* Apply to the assertValidOptions use case

* TypeScript
* Linting
* Jest
* toString on types?
* Can we reduce the number of types a TypeError can be or handle it somehow so at least there is always a decent string representation?
* Should use type checks internally?
* Number type with min/max
* Integer type with min/max
* Enum type
* Tuple type (Array with items array and minLength/maxLenth?)
* Syntactic sugar to mark object property type required?
* JSON Schema adapater (toJsonSchema, fromJsonSChema)

## Resources

* [superstruct - Data Validation](https://github.com/ianstormtaylor/superstruct). It seems superstruct only reports on the first key having an error, not all keys. This may be an issue for form validation.
* [joi - Object Schema Validation](https://github.com/hapijs/joi)
* [facebook/prop-types - Type Checking React Props](https://github.com/facebook/prop-types)
* [type_spec - Runtime Type Checks in Python](https://github.com/peter/type_spec)
* [Understanding JSON Schema](https://json-schema.org/understanding-json-schema)
* [kind-of - Check Type of Value in JavaScript](https://github.com/jonschlinkert/kind-of)
* [Clojure Spec](https://clojure.org/guides/spec)
* [Active Record Validations](https://guides.rubyonrails.org/active_record_validations.html)
