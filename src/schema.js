const Ajv = require('ajv')
const ajv = new Ajv()
require('ajv-keywords')(ajv)

const instanceOfClasses = require('ajv-keywords/keywords/instanceof').definition.CONSTRUCTORS
instanceOfClasses.Error = Error

function validate (schema, data) {
  ajv.validate(schema, data)
  return ajv.errors ? ajv.errors : undefined
}

module.exports = {
  validate
}
