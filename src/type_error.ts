import {notEmpty} from './util'

export class TypeError extends Error {
  type: any
  value: any
  code: string
  path: string[]
  childErrors: [any]

  constructor(type, value, message = 'is invalid', options: any = {}) {
    super(message);
    Object.setPrototypeOf(this, TypeError.prototype)
    this.type = type
    this.value = value
    if (options.code) this.code = options.code
    if (notEmpty(options.path)) this.path = options.path
    if (notEmpty(options.childErrors)) this.childErrors = options.childErrors
  }
}
