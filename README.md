# Runtime Type Validation for JavaScript

Runtime type checks / schema validation for JavaScript objects and values.

This library generates types that are on a JSON schema data format and this makes the types easy to parse and generate documentation from. You can use a JSON schema validator like [ajv](https://github.com/epoberezkin/ajv) to validate the types if you like but this library has validation logic built in (with a subset of the JSON schema rules).

This library basically provides:

* A thin layer of functions that provide syntactic sugar on top of JSON schema
* Extensions to JSON schema - essentially the addition of a `validate` function - that allows us to do typeof/instanceof checks as well as any custom validation that we need for our types. JSON schema is great for validating JSON data but JSON data only has six different types (object, array, string, number, boolean, and null). In JavaScript we typically need to validate more types and this library aims to help with that.

## Use Cases for this Library

* Form and model validation
* Type checking options objects and other function arguments
* Validating types of properties passed to React components
* Ability to generate API documentation from types. Types are just data structures with validation functions

## Installation

```
npm install awesome-type-check
```

## Usage

```javascript
const {typeError, ObjectType, StringType, Enum, Required} = require('awesome-type-check')

const Username = StringType({minLength: 3, maxLength: 50, pattern: /^[a-z0-9_-]+$/})

const User = ObjectType({
    name: 'string',
    username: Required(Username),
    status: Enum(['active', 'inactive'])
})

const error = typeError(User, {name: 'Joe', username: 'j', status: 'foobar'})

if (error) {
  console.log('user is not valid, error:', error)
  // => user is not valid, error: {
  //      username: 'must be at least 3 characters long but was only 1 characters',
  //      status: 'has value "foobar" (type string) but must be one of these values: active, inactive'
  //    }
} else {
  console.log('user is valid')
}
```

## TODO

* Test ability to easily generate documentation etc. based on a nested complex type (good navigability and meta data)
* More test cases: Enum, nested objects/arrays, AnyOf, AllOf, custom types, optional arrays (ArrayOrScalar)
* More syntactic sugar for string types: 'string|number!'

* Integration with React when used as PropTypes. Ability to turn off in production
* PropTypes compatibility layer?

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

* [superstruct - Data Validation](https://github.com/ianstormtaylor/superstruct)
* [joi - Object Schema Validation](https://github.com/hapijs/joi)
* [facebook/prop-types - Type Checking React Props](https://github.com/facebook/prop-types)
* [type_spec - Runtime Type Checks in Python](https://github.com/peter/type_spec)
* [Understanding JSON Schema](https://json-schema.org/understanding-json-schema)
* [kind-of - Check Type of Value in JavaScript](https://github.com/jonschlinkert/kind-of)
* [Clojure Spec](https://clojure.org/guides/spec)
* [Active Record Validations](https://guides.rubyonrails.org/active_record_validations.html)
