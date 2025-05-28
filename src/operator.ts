'use strict'

import { OperatorEvaluator, Operator as OperatorClass } from "../types"

export default class Operator<TFactValue = unknown, TJsonValue = unknown> implements OperatorClass<TFactValue, TJsonValue> {
  public name: string
  cb: OperatorEvaluator<TFactValue, TJsonValue>
  factValueValidator: (factValue: TFactValue) => boolean
  /**
   * Constructor
   * @param {string}   name - operator identifier
   * @param {function(factValue, jsonValue)} callback - operator evaluation method
   * @param {function}  [factValueValidator] - optional validator for asserting the data type of the fact
   * @returns {Operator} - instance
   */
  constructor (name: string, cb: OperatorEvaluator<TFactValue, TJsonValue>, factValueValidator?: (factValue: TFactValue) => boolean) {
    this.name = String(name)
    if (!name) throw new Error('Missing operator name')
    if (typeof cb !== 'function') throw new Error('Missing operator callback')
    this.cb = cb
    this.factValueValidator = factValueValidator
    if (!this.factValueValidator) this.factValueValidator = () => true
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the callback
   * @param   {mixed} factValue - fact result
   * @param   {mixed} jsonValue - "value" property of the condition
   * @returns {Boolean} - whether the values pass the operator test
   */
  evaluate (factValue: TFactValue, jsonValue: TJsonValue) {
    return this.factValueValidator(factValue) && this.cb(factValue, jsonValue)
  }
}
