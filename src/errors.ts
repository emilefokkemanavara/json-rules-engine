'use strict'

export class UndefinedFactError extends Error {
  code
  constructor (...props) {
    super(...props)
    this.code = 'UNDEFINED_FACT'
  }
}
