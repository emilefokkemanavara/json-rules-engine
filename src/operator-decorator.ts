'use strict'

import { OperatorDecoratorEvaluator, OperatorEvaluator, OperatorDecorator as OperatorDecoratorClass } from '../types'
import Operator from './operator'

export default class OperatorDecorator<A = unknown, B = unknown, NextA = unknown, NextB = unknown> implements OperatorDecoratorClass<A, B, NextA, NextB> {
  name: string
  cb: OperatorDecoratorEvaluator<A, B, NextA, NextB>
  factValueValidator?: (factValue: A) => boolean
  /**
   * Constructor
   * @param {string}   name - decorator identifier
   * @param {function(factValue, jsonValue, next)} callback - callback that takes the next operator as a parameter
   * @param {function}  [factValueValidator] - optional validator for asserting the data type of the fact
   * @returns {OperatorDecorator} - instance
   */
  constructor (name: string, cb: OperatorDecoratorEvaluator<A, B, NextA, NextB>, factValueValidator?: (factValue: A) => boolean) {
    this.name = String(name)
    if (!name) throw new Error('Missing decorator name')
    if (typeof cb !== 'function') throw new Error('Missing decorator callback')
    this.cb = cb
    this.factValueValidator = factValueValidator
    if (!this.factValueValidator) this.factValueValidator = () => true
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the callback
   * @param   {Operator} operator - fact result
   * @returns {Operator} - whether the values pass the operator test
   */
  decorate (operator: Operator<NextA, NextB>): Operator<A, B> {
    const next: OperatorEvaluator<NextA, NextB> = operator.evaluate.bind(operator)
    return new Operator<A, B>(
        `${this.name}:${operator.name}`,
        (factValue, jsonValue) => {
          return this.cb(factValue, jsonValue, next)
        },
        this.factValueValidator
    )
  }
}
