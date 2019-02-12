const {merge, notEmpty, compact, difference, assertValidOptions, mapObj, typeOf, getIn, unique} = require('./util')

const JSON_TYPES = ['array', 'object', 'string', 'number', 'boolean', 'null']

function toString (type) {
  if (typeOf(type) === 'string') {
    return type
  } else if (type.title) {
    return type.title
  } else if (type.name) {
    return type.name
  } else {
    return 'unnamed custom type'
  }
}

function typeObject (type) {
  if (typeOf(type) === 'string') {
    return TypeOf(type)
  } else if (typeOf(type) === 'function') {
    return Validate(type)
  } else {
    return type
  }
}

function typeError (type, value) {
  const result = typeObject(type).validate(value)
  if (result === false || result === undefined) return undefined
  if (result === true) return 'is invalid'
  return result
}

function assertType (type, value) {
  const result = typeError(type, value)
  if (result) {
    const message = typeOf(result) === 'string' ? result : 'is invalid'
    const error = new Error(message)
    error.typeError = result
    throw error
  }
}

function StringType (options = {}) {
  assertValidOptions(options, {minLength: 'number', maxLength: 'number', pattern: 'string'})
  let description
  if (notEmpty(options)) {
    const optionsDescriptions = []
    if (options.minLength) optionsDescriptions.push(`minimum length ${options.minLength}`)
    if (options.maxLength) optionsDescriptions.push(`maximum length ${options.maxLength}`)
    if (options.pattern) optionsDescriptions.push(`matching pattern ${options.pattern}`)
    description = `String with ${optionsDescriptions.join(' and ')}`
  }
  return compact({
    type: 'string',
    title: 'StringType',
    description,
    options,
    validate: (value) => {
      if (typeOf(value) !== 'string') return `must be of type string but was ${typeOf(value)}`
      const errors = []
      if (options.minLength !== undefined && value.length < options.minLength) errors.push(`must be at least ${options.minLength} characters long but was only ${value.length} characters`)
      if (options.maxLength !== undefined && value.length > options.maxLength) errors.push(`must be no more than ${options.maxLength} characters long but was ${value.length} characters`)
      if (options.pattern && !value.match(new RegExp(options.pattern))) errors.push(`must match pattern ${options.pattern}`)
      if (errors.length > 1) {
        return errors
      } else if (errors.length === 1) {
        return errors[0]
      } else {
        return undefined
      }
    }
  })
}

function NumberType (options = {}) {
  assertValidOptions(options, {minimum: 'number', maximum: 'number'})
  let description
  if (notEmpty(options)) {
    const optionsDescriptions = []
    if (options.minimum !== undefined) optionsDescriptions.push(`minimum length ${options.minimum}`)
    if (options.maximum !== undefined) optionsDescriptions.push(`maximum length ${options.maximum}`)
    description = `Number with ${optionsDescriptions.join(' and ')}`
  }
  return compact({
    type: 'number',
    title: 'NumberType',
    description,
    options,
    validate: (value) => {
      if (typeOf(value) !== 'number') return `must be of type number but was ${typeOf(value)}`
      const errors = []
      if (options.minimum !== undefined && value < options.minimum) errors.push(`must be at least ${options.minimum} was only ${value}`)
      if (options.maximum !== undefined && value > options.maximum) errors.push(`must be no more than ${options.maximum} but was ${value}`)
      if (errors.length > 1) {
        return errors
      } else if (errors.length === 1) {
        return errors[0]
      } else {
        return undefined
      }
    }
  })
}

function BoolType (options = {}) {
  return TypeOf('boolean', options)
}

function NullType (options = {}) {
  return TypeOf('null', options)
}

function Enum (values, options = {}) {
  const description = `Enum(${values.join(', ')})`
  return {
    title: 'Enum',
    description,
    enum: values,
    options,
    validate: (value) => {
      if (!values.includes(value)) {
        return `has value "${value}" (type ${typeOf(value)}) but must be one of these values: ${values.join(', ')}`
      } else {
        return undefined
      }
    }
  }
}

function InstanceOf (klass, options = {}) {
  const description = `InstanceOf(${klass.name})`
  return {
    title: 'InstanceOf',
    description,
    arg: klass,
    options,
    validate: (value) => {
      if (!(value instanceof klass)) {
        return `value "${value}" (type ${typeOf(value)}) must be an instance of ${klass.name}`
      } else {
        return undefined
      }
    }
  }
}

function TypeOf (type, options = {}) {
  if (typeOf(type) !== 'string') throw new Error(`type argument to TypeOf must be a string but was of type ${typeOf(type)}`)
  return compact({
    type: JSON_TYPES.includes(type) ? type : undefined,
    title: 'TypeOf',
    arg: type,
    options,
    validate: (value) => {
      if (typeOf(value) !== type) {
        return `value "${value}" (type ${typeOf(value)}) must be of type ${type}`
      } else {
        return undefined
      }
    }
  })
}

function Validate (validate, options = {}) {
  const description = options.description || valudate.name || 'Unnamed validate function'
  return {
    title: 'Validate',
    description,
    options,
    validate
  }
}

function ObjectType (properties, options = {}) {
  assertValidOptions(options, {title: 'string', required: ['string'], additionalProperties: 'boolean', patternProperties: 'object'})
  properties = mapObj(properties, (k, v) => typeObject(v))
  const keysMarkedRequired = Object.keys(properties).filter(key => getIn(typeObject(properties[key]), 'options.required'))
  const requiredKeys = unique((options.required || []).concat(keysMarkedRequired))
  let description
  if (notEmpty(properties)) {
    const keyDescriptions = Object.keys(properties).map((key) => {
      const meta = compact([
        properties[key].name,
        (requiredKeys.includes(key) ? 'required' : undefined)
      ])
      return notEmpty(meta) ? `${key} (${meta.join(', ')})` : key
    })
    description = `Object with keys ${keyDescriptions.join(', ')}`
    if (options.additionalProperties) description += '. Addtional keys are allowed'
  }
  const title = options.title ? `${options.title} (ObjectType)` : 'ObjectType'
  return compact({
    type: 'object',
    title,
    description,
    properties,
    additionalProperties: options.additionalProperties,
    required: options.required,
    options,
    validate: (value) => {
      if (typeof value !== 'object') return `must be of type ${title} but was ${typeOf(value)}`
      if (notEmpty(requiredKeys)) {
        const missingKeys = difference(requiredKeys, Object.keys(value))
        if (notEmpty(missingKeys)) return `is missing the following required keys: ${missingKeys.join(', ')}`
      }

      const keyErrors = compact(Object.keys(properties).reduce((acc, key) => {
        const type = properties[key]
        if (key in value) {
          const error = typeError(type, value[key])
          if (error) acc[key] = error  
        }
        return acc
      }, {}))
      if (notEmpty(keyErrors)) return keyErrors

      const patternKeys = {}
      if (options.patternProperties) {
        const patternErrors = compact(Object.keys(value).reduce((acc, key) => {
          const pattern = Object.keys(options.patternProperties).find(pattern => key.match(new RegExp(pattern)))
          if (!acc[key] && pattern) {
            const type = options.patternProperties[pattern]
            const error = typeError(type, value[key])
            if (error) acc[key] = error  
          }
          return acc
        }, {}))
        if (notEmpty(patternErrors)) return patternErrors  
      }

      if (options.additionalProperties === false) {
        const recognizedKeys = Object.keys(properties).concat(Object.keys(patternKeys))
        const invalidKeys = difference(Object.keys(value), recognizedKeys)
        if (notEmpty(invalidKeys)) return `has the following invalid keys: ${invalidKeys.join(', ')}`
      }
      return undefined
    }
  })
}

function ExactObject (properties, options = {}) {
  return ObjectType(properties, merge(options, {additionalProperties: false}))
}

function ObjectOf (valueType, options = {}) {
  return ObjectType({}, merge(options, {patternProperties: {'.*': valueType}}))
}

function ArrayType (items = 'any', options = {}) {
  items = typeObject(items)
  assertValidOptions(options, {minLength: 'number', maxLength: 'number'})
  // TODO: add minLength/maxLength to description
  const description = `Array with items ${toString(items)}`
  return compact({
    type: 'array',
    title: 'ArrayType',
    description,
    items,
    options,
    validate: (value) => {
      if (!Array.isArray(value)) return `must be array but was ${typeOf(value)}`
      const itemsError = value.reduce((acc, item, index) => {
        const itemError = typeError(items, item)
        if (itemError) acc[index] = itemError
      }, {})
      if (notEmpty(itemsError)) return itemsError
      if (options.minLength && value.length < options.minLength) return `must have at least ${options.minLength} items but had only ${value.length}`
      if (options.maxLength && value.length > options.maxLength) return `must have no more than ${options.minLength} items but had ${value.length}`
      return undefined
    }
  })
}

function Required (type) {
  const _typeObject = typeObject(type)
  const options = merge(_typeObject.options, {required: true})
  return merge(_typeObject, {options})
}

function AllOf (types, options = {}) {
  types = types.map(typeObject)
  const description = `AllOf(${types.map(toString).join(', ')})`
  return {
    title: 'AllOf',
    description,
    arg: types,
    options,
    validate: (value) => {
      for (let type of types) {
        const error = typeError(type, value)
        if (error) return error
      }
      return undefined
    }
  }
}

function AnyOf (types, options = {}) {
  types = types.map(typeObject)
  const description = `AnyOf(${types.map(toString).join(', ')})`
  return {
    title: 'AnyOf',
    description,
    arg: types,
    options,
    validate: (value) => {
      const matchingType = types.find((type) => !typeError(type, value))
      if (matchingType) {
        return undefined
      } else {
        return `is invalid - must be of type ${name}`
      }
    }
  }
}

module.exports = {
  typeError,
  assertType,
  typeObject,
  StringType,
  NumberType,
  BoolType,
  NullType,
  ObjectType,
  ExactObject,
  ObjectOf,
  ArrayType,
  Enum,
  InstanceOf,
  TypeOf,
  Validate,
  Required,
  AllOf,
  AnyOf
}
