import {merge, notEmpty, array, isArray, flatten, compact, difference, assertValidOptions, mapObj, typeOf, getIn, unique} from './util'
import {TypeError} from './type_error'

export {TypeError} from './type_error'

export const JSON_TYPES = ['array', 'object', 'string', 'number', 'boolean', 'null']

export function toString (type) {
  if (typeOf(type) === 'string') {
    return type
  } else if (type.title) {
    return type.title
  } else if (type.name) {
    return type.name
  } else if (notEmpty(type.type)) {
    return array(type.type).join('|')
  } else {
    return 'unnamed custom type'
  }
}

export function typeObject (type) {
  if (typeOf(type) === 'string') {
    return TypeOf(type)
  } else if (typeOf(type) === 'function') {
    return Validate(type)
  } else {
    return type
  }
}

export function typeOfError (type, value, options = {}) {
  const message = `must be of type ${toString(type)} but was ${typeOf(value)}`
  return new TypeError(type, value, message, merge(options, {code: 'typeof'}))
}

export function typeErrors (type, value, path: string[] = []) {
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
      const errorPath: string[] = error.path || path
      if (notEmpty(errorPath)) error.path = errorPath
      return error
    } else {
      return new TypeError(type, value, result, {path})
    }  
  })
}

export function isValid (type, value) {
  const errors = typeErrors(type, value)
  return errors === undefined ? true : false
}

export function assertType (type, value) {
  const errors = typeErrors(type, value)
  if (errors) {
    throw new TypeError(type, value, `value has invalid type - there are ${errors.length} type errors`, {childErrors: errors})
  }
}

interface StringTypeOptions {
  minLength?: number
  maxLength?: number
  pattern?: string
}

export function StringType (options: StringTypeOptions = {}) {
  assertValidOptions(options, {minLength: 'number', maxLength: 'number', pattern: 'string'})
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
    title: 'StringType',
    description,
    options,
    validate: (value) => {
      if (typeOf(value) !== 'string') return [typeOfError(type, value)]
      const errors = []
      if (options.minLength !== undefined && value.length < options.minLength) {
        errors.push(new TypeError(type, value, `must be at least ${options.minLength} characters long but was only ${value.length} characters`, {code: 'minLength'}))
      }
      if (options.maxLength !== undefined && value.length > options.maxLength) {
        errors.push(new TypeError(type, value, `must be no more than ${options.maxLength} characters long but was ${value.length} characters`, {code: 'maxLength'}))
      }
      if (options.pattern && !value.match(new RegExp(options.pattern))) {
        errors.push(new TypeError(type, value, `must match pattern ${options.pattern}`, {code: 'pattern'}))
      }
      return notEmpty(errors) ? errors : undefined
    }
  })
  return type
}

interface NumberTypeOptions {
  minimum?: number
  maximum?: number
}

export function NumberType (options: NumberTypeOptions = {}) {
  assertValidOptions(options, {minimum: 'number', maximum: 'number'})
  let description
  if (notEmpty(options)) {
    const optionsDescriptions = []
    if (options.minimum !== undefined) optionsDescriptions.push(`minimum length ${options.minimum}`)
    if (options.maximum !== undefined) optionsDescriptions.push(`maximum length ${options.maximum}`)
    description = `Number with ${optionsDescriptions.join(' and ')}`
  }
  const type = compact({
    type: 'number',
    title: 'NumberType',
    description,
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

export function BoolType (options = {}) {
  return TypeOf('boolean', options)
}

export function NullType (options = {}) {
  return TypeOf('null', options)
}

export function Enum (values, options = {}) {
  const description = `Enum(${values.join(', ')})`
  const type = {
    title: 'Enum',
    description,
    enum: values,
    options,
    validate: (value) => {
      if (!values.includes(value)) {
        return new TypeError(type, value, `has value "${value}" (type ${typeOf(value)}) but must be one of these values: ${values.join(', ')}`, {code: 'enum'})
      } else {
        return undefined
      }
    }
  }
  return type
}

export function InstanceOf (klass, options = {}) {
  const description = `InstanceOf(${klass.name})`
  const type = {
    title: 'InstanceOf',
    description,
    arg: klass,
    options,
    validate: (value) => {
      if (!(value instanceof klass)) {
        return new TypeError(type, value, `value "${value}" (type ${typeOf(value)}) must be an instance of ${klass.name}`, {code: 'instanceof'})
      } else {
        return undefined
      }
    }
  }
  return type
}

export function TypeOf (type, options = {}) {
  if (typeOf(type) !== 'string') throw new Error(`type argument to TypeOf must be a string but was of type ${typeOf(type)}`)
  const _type = compact({
    type: JSON_TYPES.includes(type) ? type : undefined,
    title: type,
    description: `TypeOf(${type})`,
    arg: type,
    options,
    validate: (value) => {
      if (typeOf(value) !== type && type !== 'any') {
        return [typeOfError(_type, value)]
      } else {
        return undefined
      }
    }
  })
  return _type
}

export function Validate (validate: Function, options: any = {}) {
  const description = options.description || validate.name || 'Unnamed validate function'
  return {
    title: 'Validate',
    description,
    options,
    validate
  }
}

interface ObjectTypeOptions {
  title?: string
  required?: string[]
  additionalProperties?: boolean
  patternProperties?: object
}

export function ObjectType (properties, options: ObjectTypeOptions = {}) {
  assertValidOptions(options, {title: 'string', required: ['string'], additionalProperties: 'boolean', patternProperties: 'object'})
  properties = mapObj(properties, (k, v) => typeObject(v))
  const keysMarkedRequired: string[] = Object.keys(properties).filter(key => getIn(typeObject(properties[key]), 'options.isRequired') === true)
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
  const title = options.title ? `${options.title} (ObjectType)` : 'ObjectType'
  const type = compact({
    type: 'object',
    title,
    description,
    properties,
    additionalProperties: options.additionalProperties,
    required: options.required,
    options,
    validate: (value, path = []) => {
      if (typeof value !== 'object') return [typeOfError(type, value, {path})]
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
          const pattern = Object.keys(options.patternProperties).find(pattern => new RegExp(pattern).test(pattern))
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

export function ExactObject (properties, options = {}) {
  return ObjectType(properties, merge(options, {additionalProperties: false}))
}

export function ObjectOf (valueType, options = {}) {
  return ObjectType({}, merge(options, {patternProperties: {'.*': valueType}}))
}

interface ArrayTypeOptions {
  minLength?: number
  maxLength?: number
}

export function ArrayType (items = 'any', options: ArrayTypeOptions = {}) {
  items = typeObject(items)
  assertValidOptions(options, {minLength: 'number', maxLength: 'number'})
  const description = `Array with items ${toString(items)}`
  const type = compact({
    type: 'array',
    title: 'ArrayType',
    description,
    items,
    options,
    validate: (value, path = []) => {
      if (!Array.isArray(value)) return [typeOfError(type, value, {path})]
      const errors = []
      const itemErrors = flatten(compact(value.map((item, index) => {
        return typeErrors(items, item, path.concat([index]))
      })))
      if (notEmpty(itemErrors)) errors.push(itemErrors)
      if (options.minLength && value.length < options.minLength) {
        errors.push(new TypeError(type, value, `must have at least ${options.minLength} items but had only ${value.length}`, {path, code: 'minLength'}))
      }
      if (options.maxLength && value.length > options.maxLength) {
        errors.push(new TypeError(type, value, `must have no more than ${options.minLength} items but had ${value.length}`, {path, code: 'maxLength'}))
      }
      return notEmpty(errors) ? flatten(errors) : undefined
    }
  })
  return type
}

export function Required (type) {
  const _typeObject = typeObject(type)
  const options = merge(_typeObject.options, {isRequired: true})
  return merge(_typeObject, {options})
}

export function AllOf (types, options = {}) {
  types = types.map(typeObject)
  const description = `AllOf(${types.map(toString).join(', ')})`
  return {
    title: 'AllOf',
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

export function AnyOf (types, options = {}) {
  types = types.map(typeObject)
  const description = `AnyOf(${types.map(toString).join(', ')})`
  const type = {
    title: 'AnyOf',
    description,
    arg: types,
    options,
    validate: (value) => {
      const matchingType = types.find((type) => !typeErrors(type, value))
      if (matchingType) {
        return undefined
      } else {
        return new TypeError(type, value, `is invalid - must be of type ${description}`)
      }
    }
  }
  return type
}
