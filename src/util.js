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

function difference (array1, array2) {
  const values1 = array1 || []
  const values2 = array2 || []
  return values1.filter(v => !values2.includes(v))
}

function assertValidOptions (options, validOptionTypes) {
	if (!options) return
	for (const key in options) {
		const actualType = typeof options[key]
		const expectedType = validOptionTypes[key]
		if (!expectedType) {
			throw new Error(
				`Unrecognized options key ${key}, should be one of ${Object.keys(validOptionTypes).join(
					', '
				)}`
			);
		}
		if (expectedType !== 'any' && actualType !== expectedType) {
			throw new Error(
				`Type of options key ${key} is ${actualType} but needs to be ${expectedType}`
			)
		}
  }
  return options
}

module.exports = {
  empty,
  notEmpty,
  compact,
  difference,
  assertValidOptions
}
