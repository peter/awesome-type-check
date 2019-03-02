function isArray (value) {
  return Array.isArray(value)
}

// See: https://stackoverflow.com/questions/5876332/how-can-i-differentiate-between-an-object-literal-other-javascript-objects
function isObject (value) {
  return notNil(value) && typeof value === 'object' && value.constructor === Object
}

function nil (value) {
  return value === undefined || value === null
}

function notNil (value) {
  return !nil(value)
}

function empty (value) {
  if (nil(value)) {
    return true
  } else if (isArray(value) || typeof value === 'string') {
    return value.length === 0
  } else if (typeof value === 'object') {
    return Object.keys(value).length === 0
  } else {
    return false
  }
}

function notEmpty (value) {
  return !empty(value)
}

function array (value) {
  if (nil(value)) return []
  return isArray(value) ? value : [value]
}

function notArray (value) {
  if (isArray(value) && value.length === 1) {
    return value[0]
  } else {
    return value
  }
}

function concat (...arrays) {
  return arrays.filter(notNil).reduce((a1, a2) => a1.concat(a2), [])
}

// NOTE: only flattens one level
function flatten (array) {
  return concat(...array)
}

function merge (object1, object2) {
  return Object.assign({}, object1, object2)
}

// Alternative name: removeEmpty
function compact (value) {
  const predicate = notEmpty
  if (isArray(value)) {
    const result = value.map(compact).filter(predicate)
    return empty(result) ? [] : result
  } else if (isObject(value)) {
    const result = Object.keys(value).reduce((acc, key) => {
      const v = compact(value[key])
      if (predicate(v)) acc[key] = v
      return acc
    }, {})
    return empty(result) ? {} : result
  } else if (empty(value)) {
    return undefined
  } else {
    return value
  }
}

// Like: http://ramdajs.com/docs/#path
function getIn (obj, path, defaultValue) {
  path = isArray(path) ? path : path.split('.')
  let result = obj
  for (const key of path) {
    const value = (result && result[key])
    if (nil(value)) {
      return defaultValue
    } else {
      result = value
    }
  }
  return result
}

function unique (array) {
  return Array.from(new Set(array))
}

function difference (array1, array2) {
  const values1 = array1 || []
  const values2 = array2 || []
  return values1.filter(v => !values2.includes(v))
}

function mapObj (obj, valueTransform) {
  if (!obj) return undefined
  return Object.entries(obj).reduce((acc, [k, v]) => {
    acc[k] = valueTransform(k, v)
    return acc
  }, {})
}

// Similar to: https://github.com/jonschlinkert/kind-of/blob/master/index.js
function typeOf (value) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'number' && isNaN(value)) return 'NaN'
  if (value === Infinity) return "Infinity";
  if (isArray(value)) return 'array'
  if (value instanceof Date) return 'date'
  if (value instanceof Error) return 'error'
  if (value instanceof RegExp) return 'regexp'
  return typeof value
}

function assertValidOptions (options, validOptionTypes, assertConfig = {}) {
	if (!options) return;
	for (const key in options) {
		const actualType = typeOf(options[key])
    let expectedType = validOptionTypes[key]
    if (typeOf(expectedType) === 'array') expectedType = 'array'
		if (assertConfig.additionalKeys !== true && !(key in validOptionTypes)) {
			throw new Error(
				`Unrecognized options key ${key}, should be one of ${Object.keys(validOptionTypes).join(
					', '
				)}`
			)
		}
		if (key in validOptionTypes && actualType !== expectedType) {
			throw new Error(
				`Type of options key ${key} is ${actualType} but needs to be ${expectedType}`
      )
		}
    if (expectedType === 'array') {
      const itemsType = validOptionTypes[key][0]
      options[key].forEach((item, index) => {
        if (typeOf(item) !== itemsType) {
          throw new Error(`Item type for options key ${key} at index ${index} is ${typeOf(item)} but needs to be ${itemsType}`)
        }
      })
    }
  }
}

module.exports = {
  isArray,
  empty,
  notEmpty,
  array,
  notArray,
  flatten,
  merge,
  compact,
  getIn,
  unique,
  difference,
  mapObj,
  typeOf,
  assertValidOptions,
}
