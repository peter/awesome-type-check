# Runtime Type Validation for JavaScript

Runtime type checks / schema validation for JavaScript objects and values.

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
const {typeError, ObjectType, StringType, Enum} = require('awesome-type-check')

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
  // => user is not valid, error: {
  //      username: 'must be at least 3 characters long but was only 1 characters',
  //      status: 'has value "foobar" (type string) but must be one of these values: active, inactive'
  //    }
} else {
  console.log('user is valid')
}
```

## TODO

* Add NumberType
* Add BoolType
* Test custom validation function/type
* ExactObject - syntactic sugar that calls ObjectType(schema, {additionalKeys: false})
* Ability for ObjectType to take a valueType
* More test cases: Enum, nested objects/arrays, AnyOf, AllOf, custom types, optional arrays (ArrayOrScalar)
* assertType(value, type)

* Integration with React. Ability to turn off in production

* Benchmark with schema

* Remove ajv dependencies and schema if we are not going to use them

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
