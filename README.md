# awesome-type-check

A JavaScript library that provides runtime type checks / schema validation for JavaScript data.

This library generates types that are on [JSON schema](https://json-schema.org/understanding-json-schema/) format and this makes the types easy to parse and generate documentation from. You can use a JSON schema validator like [ajv](https://github.com/epoberezkin/ajv) (and [ajv-keywords](https://github.com/epoberezkin/ajv-keywords)) to validate the types if you like but this library has validation logic built in (with a subset of the JSON schema rules).

This library provides:

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
const {typeErrors, TypeError, ObjectType, StringType, Enum, Required} = require('awesome-type-check')

const Username = StringType({minLength: 3, maxLength: 50, pattern: '^[a-z0-9_-]+$'})
const User = ObjectType({
    name: 'string',
    tags: ['string'],
    username: Required(Username),
    status: Enum(['active', 'inactive']),
    bonus: (v) => typeof v === 'number' && v > 0
})

const user = {
  name: 'Joe',
  tags: ['admin', 'vip'],
  username: 'j',
  status: 'foobar'
}

const errors = typeErrors(User, user)

errors.length // => 2
errors.every(e => e instanceof TypeError) // => true
errors[0].message // => 'must have at least 3 characters but had only 1'
errors[0].path // => ['username']
errors[1].message // => 'must be one of: active, inactive'
errors[1].path // => ['status']
```

## What is a Type?

A type can be specified as:

* A string that represents a type returned by the `typeOf` function, i.e. `number`, `string`, `boolean`, `function`, `object`, `array` etc. The `typeOf` function used by this library is essentially the built-in JavaScript `typeof` with a few extensions such as `null`, `undefined`, `NaN`, `Infinity`, `array`, `date`, `error`, and `regexp`. A string type can also have the value `any` which will validate against all values. Within an `ObjectType` you can add an exclamation mark to the type of a value to indicate that the corresponding key is required, i.e. `number!`. You can specify multiple types in a string by separating them by pipes, i.e. `string|number`.
* An array containing a single type, i.e. ['string']. This will validate all values that are arrays where all items are of the given type (syntactic sugar for [ArrayType](#arraytype)).
* A `validate` function. The validate function can either be a predicate that returns `true` or `false` or a function that returns `undefined` or errors. If the validate function returns `true` or `undefined` then the data is considered valid and otherwise it is considered invalid. Errors are typically an array of [TypeError](#typerror) objects.
* A JSON schema object that optionally contains a `validate` function

## Built-In Types

* [StringType](#stringtype)
* [NumberType](#numbertype)
* [BoolType](#booltype)
* [NullType](#nulltype)
* [Enum](#enum)
* [InstanceOf](#instanceOf)
* [TypeOf](#typeof)
* [ObjecType](#objectype)
* [ExactObject](#exactobject)
* [ObjectOf](#objectof)
* [NestedObject](#nestedobject)
* [ArrayType](#arraytype)
* [AllOf](#allof)
* [AnyOf](#anyof)

In addition to the types listed above you can create your own types by using [custom validate functions](#custom-validate-functions).

## Options

All built-in types take an options argument and the following options are shared across all types:

* `title` - the name of the type, for documentation purposes
* `description` - a description of the type, for documentation purposes
* `isRequired` - used to indicate that the corresponding key in an object is required (equivalent to (Required)[#required])

## Validating Function Arguments

```javascript
const {assertType, assertOptions, Enum} = require('awesome-type-check')

function area (length, options = {}) {
  assertType('number', length)
  assertOptions(options, {
    type: Enum(['square', 'circle'])
  })
  if (options.type === 'square') {
    return length * length
  } else {
    return Math.PI * Math.pow((length/2), 2)
  }
}

Math.round(area(5)) // => 20
area(5, {type: 'square'}) // => 25
Math.round(area(5, {type: 'circle'})) // => 20
area(5, {type: 'foobar'}) // => throws /must be one of: square, circle/
```

## Basic Types Represented as Strings

Here is an example of a `typeOf` type represented as a string:

```javascript
const {typeErrors, isValid} = require('awesome-type-check')
const Bonus = 'number'

typeErrors(Bonus, 123) // => undefined
isValid(Bonus, 123) // => true
typeErrors(Bonus, 'foobar')[0].message // => 'must be of type number but was string'
isValid(Bonus, 'foobar') // => false
```

You can allow for multiple types by separating them by a pipe (equivalent to [AnyOf](#anyof)):

```javascript
const {typeErrors} = require('awesome-type-check')
const Bonus = 'number|string'

typeErrors(Bonus, 123) // => undefined
typeErrors(Bonus, 'foobar') // => undefined
typeErrors(Bonus, true)[0].message // => 'must be of type number|string but was boolean'
```

String types can be converted to JSON schema objects with `typeObject`:

```javascript
const {typeObject} = require('awesome-type-check')
const MyNumber = typeObject('number')

typeof MyNumber // => 'object'
MyNumber // => {type: 'number', title: 'number', description: 'TypeOf(number)', arg: 'number'}
typeof MyNumber.validate // => 'function'
```

## TypeOf

Basic types with additional metadata can be created with the `TypeOf` function:

```javascript
const {typeErrors, isValid, TypeOf} = require('awesome-type-check')
const Bonus = TypeOf('number', {title: 'Bonus', description: 'Amount of bonus points for a user'})
typeErrors(Bonus, 123) // => undefined
isValid(Bonus, 123) // => true
typeErrors(Bonus, 'foobar')[0].message // => 'must be of type Bonus (number) but was string'
Bonus // => {type: 'number', title: 'Bonus', description: 'Amount of bonus points for a user', arg: 'number'}
```

You can also provide `TypeOf` with an array of types (equivalent to `AnyOf(types)`):

```javascript
const {typeErrors, TypeOf} = require('awesome-type-check')
const Bonus = TypeOf(['number', 'boolean'])
typeErrors(Bonus, 123) // => undefined
typeErrors(Bonus, false) // => undefined
typeErrors(Bonus, 'foobar')[0].message // => 'must be of type number|boolean but was string'
```

## Custom Validate Functions

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
typeErrors(isEven, 3)[0].message // => 'must be an even number'
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
typeErrors(IsEven, 3)[0].message // => 'must be an even number'
isValid(IsEven, 2) // => true
isValid(IsEven, 3) // => false
```

## Validating Nested Data

You can use `ObjectType` and `ArrayType` to validate nested data:

```javascript
const {typeErrors, ObjectType, ArrayType} = require('awesome-type-check')
const User = ObjectType({
  username: 'string!',
  items: ArrayType(ObjectType({
    name: 'string!',
    createdAt: 'date!'
  }))
})

typeErrors(User, {username: 'joe'}) // => undefined
const errors = typeErrors(User, {username: 123, items: [{name: 'foo'}, {name: 123, createdAt: new Date()}]})
errors.length // => 3
errors[0].path // => ['username']
errors[0].message // => 'must be of type string but was number'
errors[1].path // => ['items', 0]
errors[1].message // => 'is missing the following required keys: createdAt'
errors[2].path // => ['items', 1, 'name']
errors[2].message // => 'must be of type string but was number'
```

See [NestedObject](#nesteobject) below for a slightly nicer syntax for nested data.

## NestedObject

`NestedObject` is a wrapper around `ObjectType` that provides some syntactic sugar for validating nested data.
Any object literals nested in the structure provided to `NestedObject` will be wrapped by the `ObjectType`
function (i.e. interpreted as object properties) unless they contain a `validate` property with a value
of type function (i.e. any nested built-in types will be preserved):

```javascript
const {typeErrors, NestedObject} = require('awesome-type-check')
const User = NestedObject({
  username: 'string!',
  items: [{
    name: 'string!',
    createdAt: 'date!'
  }]
})

typeErrors(User, {username: 'joe'}) // => undefined
const errors = typeErrors(User, {username: 123, items: [{name: 'foo'}, {name: 123, createdAt: new Date()}]})
errors.length // => 3
errors[0].path // => ['username']
errors[0].message // => 'must be of type string but was number'
errors[1].path // => ['items', 0]
errors[1].message // => 'is missing the following required keys: createdAt'
errors[2].path // => ['items', 1, 'name']
errors[2].message // => 'must be of type string but was number'
```

## TypeError

On validation failure the `typeErrors` method will return an array of `TypeError` objects with these properties:

* `stack` - a stacktrace to help you figure out where in your code validation failed
* `message` - an error message
* `type` - the type definition (JSON schema object) for which validation failed
* `value` - the data for which validation failed
* `path` - if validation failed inside an object or array (or a nested combination of them) the path will show you exactly where in the data structure validation failed
* `code` - an error category/classification, i.e. `maxLength` if a string is too long, or `typeof` if the data type was wrong etc.

## StringType

Use `StringType` to validate string values and optionally provide `minLength`, `maxLength`, and `pattern` options:

```javascript
const {typeErrors, StringType} = require('awesome-type-check')
const Username = StringType({minLength: 3, maxLength: 50, pattern: '^[a-z0-9_-]+$'})
typeErrors(Username, 'foobar') // => undefined
typeErrors(Username, 123)[0].message // => 'must be of type StringType but was number'
typeErrors(Username, 'fo')[0].message // => 'must have at least 3 characters but had only 2'
typeErrors(Username, '!').map(e => e.message) // => ['must have at least 3 characters but had only 1', 'must match pattern ^[a-z0-9_-]+$']
Username // => { type: 'string', title: 'StringType', minLength: 3, maxLength: 50, pattern: '^[a-z0-9_-]+$', description: 'String with minimum length 3 and maximum length 50 and pattern ^[a-z0-9_-]+$',}
```

## NumberType

Validates number values with optional `minimum` and `maximum` restrictions:

```javascript
const {typeErrors, NumberType} = require('awesome-type-check')
const Score = NumberType({minimum: 0, maximum: 100})
typeErrors(Score, 0) // => undefined
typeErrors(Score, 10) // => undefined
typeErrors(Score, 100) // => undefined
typeErrors(Score, 'foobar')[0].message // => 'must be of type NumberType but was string'
typeErrors(Score, -1)[0].message // => 'must be at least 0 was only -1'
typeErrors(Score, 101)[0].message // 'must be no more than 100 but was 101'
Score // => {type: 'number', title: 'NumberType', minimum: 0, maximum: 100, description: 'Number with minimum length 0 and maximum length 100'}
```

## BoolType

Validate that a value is `true` or `false`, equivalent to `TypeOf('boolean'`:

```javascript
const {typeErrors, BoolType, TypeOf} = require('awesome-type-check')
const Active = BoolType()
typeErrors(Active, false) // => undefined
typeErrors(Active, true) // => undefined
typeErrors(Active, {})[0].message // => 'must be of type boolean but was object'
typeErrors(TypeOf('boolean'), false) // => undefined
typeErrors(TypeOf('boolean'), true) // => undefined
typeErrors(TypeOf('boolean'), {})[0].message // => 'must be of type boolean but was object'
Active // => {type: 'boolean', title: 'boolean', description: 'TypeOf(boolean)', arg: 'boolean'}
```

## NullType

Validates that a value is `null`. Equivalent to `TypeOf('null')`:

```javascript
const {typeErrors, NullType} = require('awesome-type-check')
typeErrors(NullType(), null) // => undefined
typeErrors(NullType(), undefined)[0].message // => 'must be of type null but was undefined'
typeErrors(NullType(), [])[0].message // => 'must be of type null but was array'
```

## ObjectType

Use `ObjectType` to validate objects, accepts [JSON schema equivalent](https://json-schema.org/understanding-json-schema/reference/object.html) options `required` and `additionalProperties`:

```javascript
const {typeErrors, ObjectType, ArrayType, Required} = require('awesome-type-check')
const User = ObjectType({
  username: Required('string'),
  score: 'number'
})

typeErrors(User, {username: 'joe'}) // => undefined
const errors = typeErrors(User, {username: 123, score: true})
errors.length // => 2
errors[0].path // => ['username']
errors[0].message // => 'must be of type string but was number'
errors[1].path // => ['score']
errors[1].message // => 'must be of type number but was boolean'
```

## ExactObject

Use `ExactObject` to validate objects where no additional properties other than those specified are allowed. Syntactic sugar for `ObjectType(properties, {addtionalProperties: false})`:

```javascript
const {typeErrors, ExactObject} = require('awesome-type-check')
const User = ExactObject({
  username: 'string'
})

typeErrors(User, {username: 'joe'}) // => undefined
const errors = typeErrors(User, {userName: 'joe'})
errors.length // => 1
errors[0].message // => 'has the following invalid keys: userName'
```

## ObjectOf

Use `ObjectOf` to validate that all values of an object must be of a certain type. Syntactic sugar for `ObjectType({}, {patternProperties: {'.*': valueType}})`:

```javascript
const {typeErrors, ObjectOf} = require('awesome-type-check')
const Callbacks = ObjectOf('function')

typeErrors(Callbacks, {onClick: function () {}}) // => undefined
const errors = typeErrors(Callbacks, {onClick: []})
errors.length // => 1
errors[0].message // => 'must be of type function but was array'
```

## ArrayType

Use `ArrayType` to validate that a value must be an `array`. Options are `minItems` and `maxItems`:

```javascript
const {typeErrors, ArrayType} = require('awesome-type-check')
const Numbers = ArrayType('number', {minItems: 2, maxItems: 5})

typeErrors(Numbers, [1, 2]) // => undefined
const errors = typeErrors(Numbers, ['foobar'])
errors.length // => 2
errors[0].message // => 'must be of type number but was string'
errors[1].message // => 'must have at least 2 items but had only 1'
```

There is also syntactic sugar available that allows you to use an array literal to represent an `ArrayType`:

```javascript
const {typeErrors} = require('awesome-type-check')
const Numbers = ['number']

typeErrors(Numbers, [1, 2]) // => undefined
typeErrors(Numbers, [1, 'foobar'])[0].message // => 'must be of type number but was string'
```

## Enum

Use `Enum` to check that a value is in a given set of values:

```javascript
const {typeErrors, Enum} = require('awesome-type-check')
const Status = Enum(['active', 'inactive'])

typeErrors(Status, 'active') // => undefined
typeErrors(Status, 'inactive') // => undefined
typeErrors(Status, 'foobar')[0].message // => 'must be one of: active, inactive'
```

## InstanceOf

Use `InstanceOf` to check that a value has a certain constructor (or class):

```javascript
const {typeErrors, InstanceOf} = require('awesome-type-check')
function Car(make, model) {
  this.make = make
  this.model = model
}

typeErrors(InstanceOf(Car), new Car('volvo', 'v90')) // => undefined
typeErrors(InstanceOf(Date), new Date) // => undefined
typeErrors(InstanceOf(RegExp), new Date)[0].message // => 'must be instanceof RegExp'
```

## Required

You can use `Required` to mark a key in an `ObjectType` as required:

```javascript
const {typeErrors, ObjectType, Required} = require('awesome-type-check')
const User = ObjectType({
  username: Required('string'),
  bio: 'string'
})

typeErrors(User, {username: 'joe'}) // => undefined
typeErrors(User, {})[0].message // => 'is missing the following required keys: username'
```

You can also mark keys with types represented as strings as required by adding an exclamation mark:

```javascript
const {typeErrors, ObjectType} = require('awesome-type-check')
const User = ObjectType({
  username: 'string!',
  bio: 'string'
})

typeErrors(User, {username: 'joe'}) // => undefined
typeErrors(User, {})[0].message // => 'is missing the following required keys: username'
```

## AllOf

Use `AllOf` to check that a value must validate against *all* of the given types (intersection type):

```javascript
const {typeErrors, NumberType, AllOf} = require('awesome-type-check')
const PositiveNumber = NumberType({minimum: 0})
const DivisibleByTen = (v) => v % 10 === 0 ? undefined : 'must be divisible by 10'
const Score = AllOf([PositiveNumber, DivisibleByTen])

typeErrors(Score, 0) // => undefined
typeErrors(Score, 10) // => undefined
typeErrors(Score, 15)[0].message // => 'must be divisible by 10'
typeErrors(Score, 'foobar')[0].message // => 'must be of type NumberType but was string'
```

## AnyOf

Use `AnyOf` to check that a value must validate against *at least one* of the given types (union type):

```javascript
const {typeErrors, NumberType, AnyOf} = require('awesome-type-check')
const PositiveNumber = NumberType({minimum: 0})
const DivisibleByTen = (v) => v % 10 === 0 ? undefined : 'must be divisible by 10'
const Score = AnyOf([PositiveNumber, DivisibleByTen])

typeErrors(Score, 0) // => undefined
typeErrors(Score, 3) // => undefined
typeErrors(Score, -10) // => undefined
typeErrors(Score, -3)[0].message // => 'must be of type AnyOf(NumberType, DivisibleByTen)'
typeErrors(Score, 'foobar')[0].message // => 'must be of type AnyOf(NumberType, DivisibleByTen)'
```

## TODO

* ESLint
* Unit test for NestedObject
* Add error toJSON test (i.e. check JSON.parse(JSON.stringify(error)))
* Always preserve constructor type name (ObjectType, ArrayType etc.) in constructor property?
* Add ajv schema validation to nested type test
* Add comparison to other libraries in RAEDME (prop-types, superstruct, joi etc.)
* Improve generic message if you can extract title
* Create single ES5/UMD file with Babel/Rollup for client side use? Try https://www.pikapkg.com/blog/introducing-pika-pack
* Remove @pika/pack from package.json and from pkg if we can't get it to work properly
* Create a JSFiddle with unpkg (https://medium.com/cameron-nokes/the-30-second-guide-to-publishing-a-typescript-package-to-npm-89d93ff7bccd)
* Test ability to easily generate documentation etc. based on a nested complex type (good navigability and meta data)
* More test cases: Enum, nested objects/arrays, AnyOf, AllOf, custom types, optional arrays (ArrayOrScalar)
* Integration with React when used as PropTypes. Ability to turn off in production. PropTypes compatibility layer?
* Apply to the assertValidOptions use case, maybe in versioned-api?
* Tuple type

## Resources

* [superstruct - Data Validation](https://github.com/ianstormtaylor/superstruct). It seems superstruct only reports on the first key having an error, not all keys. This may be an issue for form validation.
* [joi - Object Schema Validation](https://github.com/hapijs/joi)
* [facebook/prop-types - Type Checking React Props](https://github.com/facebook/prop-types)
* [type_spec - Runtime Type Checks in Python](https://github.com/peter/type_spec)
* [Understanding JSON Schema](https://json-schema.org/understanding-json-schema)
* [kind-of - Check Type of Value in JavaScript](https://github.com/jonschlinkert/kind-of)
* [Clojure Spec](https://clojure.org/guides/spec)
* [Active Record Validations](https://guides.rubyonrails.org/active_record_validations.html)
