# Runtime Type Validation for JavaScript

Runtime type checks / schema validation for JavaScript objects and values.

## Usage

```javascript
const {ObjectType} = require('')
const type = 
```

## TODO

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
* Use custom typeOf similar to what the kind-of package does?

## Resources

* [joi - Object Schema Validation](https://github.com/hapijs/joi)
* [facebook/prop-types - Type Checking React Props](https://github.com/facebook/prop-types)
* [type_spec - Runtime Type Checks in Python](https://github.com/peter/type_spec)
* [Understanding JSON Schema](https://json-schema.org/understanding-json-schema)
* [kind-of - Check Type of Value in JavaScript](https://github.com/jonschlinkert/kind-of)
