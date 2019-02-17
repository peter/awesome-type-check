const {
  notEmpty
} = require('./util');

class TypeError extends Error {
  constructor(type, value, message = 'is invalid', options = {}) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TypeError);
    }

    this.message = message;
    this.type = type;
    this.value = value;
    if (options.code) this.code = options.code;
    if (notEmpty(options.path)) this.path = options.path;
    if (notEmpty(options.childErrors)) this.childErrors = options.childErrors;
  }

  toJSON() {
    const data = {};
    Object.getOwnPropertyNames(this).forEach(key => data[key] = this[key]);
    return data;
  }

}

module.exports = TypeError;