const {notEmpty, compact, difference, assertValidOptions} = require('./util')

function toString (type) {
  if (typeof type === 'string') {
    return type
  } else if (type.name) {
    return type.name
  } else {
    return 'unnamed custom type'
  }
}

function typeError (type, value) {
  if (typeof type === 'string') {
    return typeof value === type ? undefined : `must be of type string but was ${typeof value}`
  }
  const validate = type.validate || type
  const result = validate(value)
  if (result === false || result === undefined) return undefined
  if (result === true) return 'is invalid'
  return result
}

function StringType (options = {}) {
  assertValidOptions(options, {minLength: 'number', maxLength: 'number', pattern: 'string'})
  let description
  if (notEmpty(options)) {
    const optionsDescriptions = []
    if (options.minLength) optionsDescriptions.push(`minimum length ${options.minLength}`)
    if (options.maxLength) optionsDescriptions.push(`maximum length ${options.maxLength}`)
    if (options.pattern) optionsDescriptions.push(`that matches pattern ${options.pattern}`)
    description = `String with ${optionsDescriptions.join(' and ')}`
  }
  return compact({
    name: 'String',
    description,
    options,
    validate: (value) => {
      if (typeof value !== 'string') return `must be of type string but was ${typeof value}`
      const errors = []
      if (options.minLength && value.length < options.minLength) errors.push(`must be at least ${options.minLength} characters long but was only ${value.length} characters`)
      if (options.maxLength && value.length > options.maxLength) errors.push(`must be no more than ${options.maxLength} characters long but was ${value.length} characters`)
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

function ObjectType (options = {}) {
  assertValidOptions(options, {keys: 'object', requiredKeys: 'array', additionalKeys: 'boolean'})
  let description
  if (notEmpty(options.keys)) {
    const keyDescriptions = Object.keys(options.keys).map((key) => {
      const meta = compact([
        options.keys[key].name
        ((options.requiredKeys || []).includes(key) ? 'required' : undefined)
      ])
      return notEmpty(meta) ? `${key} (${meta.join(', ')})` : key
    })
    description = `Object with keys ${keyDescriptions.join(', ')}`
    if (options.additionalKeys) description += '. Addtional keys are allowed'
  }
  return compact({
    name: 'Object',
    description,
    options,
    validate: (value) => {
      if (typeof value !== 'object') return `must be of type object but was ${typeof value}`
      if (!options.additionalKeys) {
        const invalidKeys = difference(Object.keys(value), Object.keys(options.keys))
        if (notEmpty(invalidKeys)) return `has the following invalid keys: ${invalidKeys.join(', ')}`
      }
      if (notEmpty(options.requiredKeys)) {
        const missingKeys = difference(options.requiredKeys, Object.keys(options.keys))
        if (notEmpty(missingKeys)) return `is missing the following required keys: ${missingKeys.join(', ')}`
      }
      const keyErrors = compact(Object.keys(options.keys).reduce((acc, key) => {
        const type = options.keys[key]
        const error = typeError(type, value[key])
        if (error) acc[key] = error
        return acc
      }, {}))
      return notEmpty(keyErrors) ? keyErrors : undefined
    }
  })
}

function ArrayType (options = {}) {
  assertValidOptions(options, {items: 'any', minLength: 'number', maxLength: 'number'})
  if (!options.items) throw new Error('Missing items key when creating ArrayType')
  // TODO: add minLength/maxLength to description
  const description = `Array with items ${toString(options.items)}`
  return compact({
    name: 'Array',
    description,
    options,
    validate: (value) => {
      if (!Array.isArray(value)) return `must be array but was ${typeof value}`
      const itemsError = value.reduce((acc, item, index) => {
        const itemError = typeError(options.items, item)
        if (itemError) acc[index] = itemError
      }, {})
      if (notEmpty(itemsError)) return itemsError
      if (options.minLength && value.length < options.minLength) return `must have at least ${options.minLength} items but had only ${value.length}`
      if (options.maxLength && value.length > options.maxLength) return `must have no more than ${options.minLength} items but had ${value.length}`
      return undefined
    }
  })
}

function AllOf (...types) {
  const name = `AllOf(${types.map(toString).join(', ')})`
  return {
    name,
    validate: (value) => {
      for (let type of types) {
        const error = typeError(type, value)
        if (error) return error
      }
      return undefined
    }
  }
}

function AnyOf (...types) {
  const name = `AnyOf(${types.map(toString).join(', ')})`
  return {
    name,
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
  StringType,
  ObjectType,
  ArrayType,
  AllOf,
  AnyOf
}
