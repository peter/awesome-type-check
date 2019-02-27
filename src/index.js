const {merge, notEmpty, empty, array, notArray, isArray, flatten, compact, difference, assertValidOptions, mapObj, typeOf, getIn, unique} = require('./util')
const TypeError = require('./type_error')

const JSON_TYPES = ['array', 'object', 'string', 'number', 'boolean', 'null']

function toString (type) {
  const baseType = notEmpty(type.type) ? array(type.type).join('|') : undefined
  if (typeOf(type) === 'string') {
    return type
  } else if (type.title) {
    return (baseType && !type.title.toLowerCase().includes(baseType)) ? `${type.title} (${baseType})` : type.title
  } else if (type.name) {
    return (baseType && !type.name.toLowerCase().includes(baseType)) ? `${type.name} (${baseType})` : type.name
  } else if (notEmpty(type.type)) {
    return baseType
  } else {
    return 'unnamed custom type'
  }
}

function typeObject (type) {
  if (typeOf(type) === 'string') {
    const options = {isRequired: type.endsWith('!')}
    const types = (options.isRequired ? type.substring(0, type.length - 1) : type).split('|')
    return TypeOf(notArray(types), options)
  } else if (typeOf(type) === 'array') {
    return ArrayType(typeObject(type[0]))
  } else if (typeOf(type) === 'function') {
    return Validate(type)
  } else {
    return type
  }
}

function typeOfError (type, value, options = {}) {
  const message = `must be of type ${toString(type)} but was ${typeOf(value)}`
  return new TypeError(type, value, message, merge(options, {code: 'typeof'}))
}

function typeErrors (type, value, path = []) {
  const _typeObject = typeObject(type)
  if (notEmpty(_typeObject.type) && !array(_typeObject.type).find(t => typeOf(value) === t || t === 'any')) {
    return [typeOfError(_typeObject, value, {path})]
  }
  if (!_typeObject.validate) return undefined
  const result = _typeObject.validate(value, path)
  if (result === true || result === undefined) return undefined
  if (result === false) return [new TypeError(type, value, 'is invalid', {path})]
  return array(result).map((error) => {
    if (error instanceof TypeError) {
      const errorPath = error.path || path
      if (notEmpty(errorPath)) error.path = errorPath
      return error
    } else {
      return new TypeError(type, value, result, {path})
    }  
  })
}

function isValid (type, value) {
  const errors = typeErrors(type, value)
  return errors === undefined ? true : false
}

function assertType (type, value) {
  const errors = typeErrors(type, value)
  if (errors) {
    throw new TypeError(type, value, `value has invalid type - there are ${errors.length} type errors: ${array(errors).map(e => e.message).join(', ')}`, {childErrors: errors})
  }
}

function assertOptions (options, validOptions) {
  assertType(ObjectType(validOptions), options)
}

function assertTypeOptions (options, validOptionTypes = {}) {
  const SHARED_OPTIONS = {name: 'string', title: 'string', description: 'string', isRequired: 'boolean'}
  assertValidOptions(options, merge(validOptionTypes, SHARED_OPTIONS))
}

function StringType (options = {}) {
  assertTypeOptions(options, {minLength: 'number', maxLength: 'number', pattern: 'string'})
  let description
  if (notEmpty(options)) {
    const optionsDescriptions = []
    if (options.minLength) optionsDescriptions.push(`minimum length ${options.minLength}`)
    if (options.maxLength) optionsDescriptions.push(`maximum length ${options.maxLength}`)
    if (options.pattern) optionsDescriptions.push(`pattern ${options.pattern}`)
    description = `String with ${optionsDescriptions.join(' and ')}`
  }
  const type = compact({
    type: 'string',
    name: (options.name || 'StringType'),
    title: (options.title || 'StringType'),
    minLength: options.minLength,
    maxLength: options.maxLength,
    pattern: options.pattern,
    description: (options.description || description),
    options,
    validate: (value) => {
      if (typeOf(value) !== 'string') return [typeOfError(type, value)]
      const errors = []
      if (options.minLength !== undefined && value.length < options.minLength) {
        errors.push(new TypeError(type, value, `must have at least ${options.minLength} characters but had only ${value.length}`, {code: 'minLength'}))
      }
      if (options.maxLength !== undefined && value.length > options.maxLength) {
        errors.push(new TypeError(type, value, `must have at most ${options.maxLength} characters but had ${value.length}`, {code: 'maxLength'}))
      }
      if (options.pattern && !value.match(new RegExp(options.pattern))) {
        errors.push(new TypeError(type, value, `must match pattern ${options.pattern}`, {code: 'pattern'}))
      }
      return notEmpty(errors) ? errors : undefined
    }
  })
  return type
}

function NumberType (options = {}) {
  assertTypeOptions(options, {minimum: 'number', maximum: 'number'})
  let description
  if (notEmpty(options)) {
    const optionsDescriptions = []
    if (options.minimum !== undefined) optionsDescriptions.push(`minimum length ${options.minimum}`)
    if (options.maximum !== undefined) optionsDescriptions.push(`maximum length ${options.maximum}`)
    description = `Number with ${optionsDescriptions.join(' and ')}`
  }
  const type = compact({
    type: 'number',
    name: (options.name || 'NumberType'),
    title: (options.title || 'NumberType'),
    minimum: options.minimum,
    maximum: options.maximum,
    description: (options.description || description),
    options,
    validate: (value) => {
      if (typeOf(value) !== 'number') return [typeOfError(type, value)]
      const errors = []
      if (options.minimum !== undefined && value < options.minimum) {
        errors.push(new TypeError(type, value, `must be at least ${options.minimum} was only ${value}`, {code: 'minimum'}))
      }
      if (options.maximum !== undefined && value > options.maximum) {
        errors.push(new TypeError(type, value, `must be no more than ${options.maximum} but was ${value}`, {code: 'maximum'}))
      }
      return notEmpty(errors) ? errors : undefined
    }
  })
  return type
}

function BoolType (options = {}) {
  return TypeOf('boolean', merge(options, {name: 'BoolType'}))
}

function NullType (options = {}) {
  return TypeOf('null', merge(options, {name: 'NullType'}))
}

function Enum (values, options = {}) {
  if (typeOf(values) !== 'array' || values.length === 0) throw new Error('Enum expects a non empty array of values as first argument')
  assertTypeOptions(options)
  const description = options.description || `Enum(${values.join(', ')})`
  const type = {
    name: (options.name || 'Enum'),
    title: (options.title || 'Enum'),
    description,
    enum: values,
    options,
    validate: (value) => {
      if (!values.includes(value)) {
        return new TypeError(type, value, `must be one of: ${values.join(', ')}`, {code: 'enum'})
      } else {
        return undefined
      }
    }
  }
  return type
}

function InstanceOf (klass, options = {}) {
  if (empty(klass) || !klass.name || !klass.constructor) throw new Error('InstanceOf expects a class as first argument')
  assertTypeOptions(options)
  const description = options.description || `InstanceOf(${klass.name})`
  const type = {
    name: (options.name || 'InstanceOf'),
    title: (options.title || 'InstanceOf'),
    description,
    arg: klass,
    options,
    validate: (value) => {
      if (!(value instanceof klass)) {
        return new TypeError(type, value, `must be instanceof ${klass.name}`, {code: 'instanceof'})
      } else {
        return undefined
      }
    }
  }
  return type
}

function TypeOf (type, options = {}) {
  if (!['string', 'array'].includes(typeOf(type)) || empty(type)) throw new Error('TypeOf expects a non-empty string or array as first argument')
  assertTypeOptions(options)
  const _type = compact({
    type: array(type).every(t => JSON_TYPES.includes(t)) ? notArray(type) : undefined,
    name: (options.name || 'TypeOf'),
    title: (options.title || array(type).join('|')),
    description: (options.description || `TypeOf(${type})`),
    arg: type,
    options,
    validate: (value) => {
      if (!array(type).includes(typeOf(value)) && !array(type).includes('any')) {
        return [typeOfError(_type, value)]
      } else {
        return undefined
      }
    }
  })
  return _type
}

function Validate (validate, options = {}) {
  if (typeOf(validate) !== 'function') throw new Error('Validate expects a validation function as its first argument')
  const description = options.description || 'Validate function'
  return {
    name: (options.name || 'Validate'),
    title: (options.title || validate.name || 'Validate'),
    description,
    options,
    validate
  }
}

function ObjectType (properties, options = {}) {
  if (typeOf(properties) !== 'object' || properties == null) throw new Error('ObjectType expects properties object as its first argument') 
  assertTypeOptions(options, {title: 'string', required: ['string'], additionalProperties: 'boolean', patternProperties: 'object'})
  properties = mapObj(properties, (k, v) => typeObject(v))
  const keysMarkedRequired = Object.keys(properties).filter(key => getIn(typeObject(properties[key]), 'options.isRequired') === true)
  options.required = unique((options.required || []).concat(keysMarkedRequired))
  let description
  if (notEmpty(properties)) {
    const keyDescriptions = Object.keys(properties).map((key) => {
      const meta = compact([
        properties[key].name,
        (options.required.includes(key) ? 'required' : undefined)
      ])
      return notEmpty(meta) ? `${key} (${meta.join(', ')})` : key
    })
    description = `Object with keys ${keyDescriptions.join(', ')}`
    if (options.additionalProperties) description += '. Addtional keys are allowed'
  }
  const type = compact({
    type: 'object',
    name: (options.name || 'ObjectType'),
    title: (options.title || 'ObjectType'),
    description: (options.description || description),
    properties,
    additionalProperties: options.additionalProperties,
    required: options.required,
    options,
    validate: (value, path = []) => {
      if (typeOf(value) !== 'object') return [typeOfError(type, value, {path})]
      const errors = []
      if (notEmpty(options.required)) {
        const missingKeys = difference(options.required, Object.keys(value))
        if (notEmpty(missingKeys)) errors.push(new TypeError(type, value, `is missing the following required keys: ${missingKeys.join(', ')}`, {path, code: 'required'}))
      }

      const keyErrors = flatten(compact(Object.keys(properties).map((key) => {
        if (key in value) {
          const keyType = properties[key]
          return array(typeErrors(keyType, value[key], path.concat([key])))
        }
      })))
      if (notEmpty(keyErrors)) errors.push(keyErrors)

      const patternKeys = {}
      if (options.patternProperties) {
        const patternErrors = flatten(compact(Object.keys(value).map((key) => {
          const pattern = Object.keys(options.patternProperties).find(pattern => key.match(new RegExp(pattern)))
          if (pattern) {
            const patternType = options.patternProperties[pattern]
            return typeErrors(patternType, value[key], path.concat([key]))
          }
        })))
        if (notEmpty(patternErrors)) errors.push(patternErrors)
      }

      if (options.additionalProperties === false) {
        const recognizedKeys = Object.keys(properties).concat(Object.keys(patternKeys))
        const invalidKeys = difference(Object.keys(value), recognizedKeys)
        if (notEmpty(invalidKeys)) errors.push(new TypeError(type, value, `has the following invalid keys: ${invalidKeys.join(', ')}`, {path, code: 'additionalProperties'}))
      }
      return notEmpty(errors) ? flatten(errors) : undefined
    }
  })
  return type
}

function ExactObject (properties, options = {}) {
  return ObjectType(properties, merge(options, {name: 'ExactObject', additionalProperties: false}))
}

function ObjectOf (valueType, options = {}) {
  return ObjectType({}, merge(options, {name: 'ObjectOf', patternProperties: {'.*': valueType}}))
}

function convertNested (properties, options = {}) {
  if (typeOf(properties) === 'object' && typeOf(properties.validate) !== 'function') {
    // console.log('pm debug case 1 (object)', properties)
    return ObjectType(mapObj(properties, (k, v) => convertNested(v)), options)
  } else if (typeOf(properties) === 'array') {
    // console.log('pm debug case 2 (array)', properties)
    return typeObject(properties.map(item => convertNested(item)))
  } else {
    // console.log('pm debug case 3 (other)', properties)
    return typeObject(properties)
  }
}

function NestedObject (properties, options = {}) {
  if (typeOf(properties) !== 'object' || properties == null) throw new Error('NestedObject expects properties object as its first argument') 
  return convertNested(properties, options)
}

function ArrayType (items = 'any', options = {}) {
  items = typeObject(items)
  assertTypeOptions(options, {minItems: 'number', maxItems: 'number'})
  const description = options.description || `Array with ${toString(items)}`
  const type = compact({
    type: 'array',
    name: (options.name || 'ArrayType'),
    title: (options.title || 'ArrayType'),
    description,
    items: items,
    minItems: options.minItems,
    maxItems: options.maxItems,
    options,
    validate: (value, path = []) => {
      if (!Array.isArray(value)) return [typeOfError(type, value, {path})]
      const errors = []
      const itemErrors = flatten(compact(value.map((item, index) => {
        return typeErrors(items, item, path.concat([index]))
      })))
      if (notEmpty(itemErrors)) errors.push(itemErrors)
      if (options.minItems && value.length < options.minItems) {
        errors.push(new TypeError(type, value, `must have at least ${options.minItems} items but had only ${value.length}`, {path, code: 'minItems'}))
      }
      if (options.maxItems && value.length > options.maxItems) {
        errors.push(new TypeError(type, value, `must have no more than ${options.maxItems} items but had ${value.length}`, {path, code: 'maxItems'}))
      }
      return notEmpty(errors) ? flatten(errors) : undefined
    }
  })
  return type
}

function Required (type) {
  const _typeObject = typeObject(type)
  const options = merge(_typeObject.options, {isRequired: true})
  return merge(_typeObject, {options})
}

function AllOf (types, options = {}) {
  if (typeOf(types) !== 'array' || empty(types)) throw new Error('AllOf expects non-empty array as its first argument')
  types = types.map(typeObject)
  const description = options.description || `AllOf(${types.map(toString).join(', ')})`
  return {
    name: (options.name || 'AllOf'),
    title: (options.title || 'AllOf'),
    description,
    arg: types,
    options,
    validate: (value) => {
      for (let type of types) {
        const errors = typeErrors(type, value)
        if (errors) return errors
      }
      return undefined
    }
  }
}

function AnyOf (types, options = {}) {
  if (typeOf(types) !== 'array' || empty(types)) throw new Error('AnyOf expects non-empty array as its first argument')
  types = types.map(typeObject)
  const description = options.description || `AnyOf(${types.map(toString).join(', ')})`
  const type = {
    name: (options.name || 'AnyOf'),
    title: (options.title || 'AnyOf'),
    description,
    arg: types,
    options,
    validate: (value) => {
      const matchingType = types.find((type) => !typeErrors(type, value))
      if (matchingType) {
        return undefined
      } else {
        return new TypeError(type, value, `must be of type ${description}`)
      }
    }
  }
  return type
}

module.exports = {
  TypeError,
  typeErrors,
  isValid,
  assertType,
  assertOptions,
  typeObject,
  StringType,
  NumberType,
  BoolType,
  NullType,
  ObjectType,
  ExactObject,
  ObjectOf,
  NestedObject,
  ArrayType,
  Enum,
  InstanceOf,
  TypeOf,
  Validate,
  Required,
  AllOf,
  AnyOf
}
