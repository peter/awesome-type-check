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

* A string that represents a type returned by the `typeOf` function, i.e. `number`, `string`, `boolean`, `function`, `object`, `array` etc. The `typeOf` function used by this library is essentially the built-in JavaScript `typeof` with a few extensions such as `null`, `undefined`, `array`, `date`, `error`, `regexp`. A string type can also have the value `any` which will validate against all values.
* A `validate` function. The validate function can either be a predicate that returns `true` or `false` or a function that returns `undefined` or errors. If the validate function returns `true` or `undefined` then the type is considered valid and otherwise it is considered invalid. Errors are typically an array of `TypeError` objects.
* A JSON schema object that optionally contains a `validate` function

Here is an example of a type represented as a string:

```javascript
const {typeErrors, isValid} = require('awesome-type-check')
const myType = 'number'
typeErrors(myType, 123) // => undefined
isValid(myType, 123) // => true
typeErrors(myType, 'foobar') // => [ { Error: value "foobar" (type string) must be of type number } ]
isValid(myType, 'foobar') // => false
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

Here is an example of using `Validate` to create the same type:

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

## TODO

* ESLint
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
