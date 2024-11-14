import { OperatorEvaluator, Operator as OperatorType } from '../types'

export default class Operator<TFactValue = unknown, TJsonValue = unknown> implements OperatorType<TFactValue, TJsonValue> {
  name: string
  private factValueValidator: (value: TFactValue) => boolean
  private cb: OperatorEvaluator<TFactValue, TJsonValue>
  /**
   * Constructor
   * @param {string}   name - operator identifier
   * @param {function(factValue, jsonValue)} callback - operator evaluation method
   * @param {function}  [factValueValidator] - optional validator for asserting the data type of the fact
   * @returns {Operator} - instance
   */
  constructor(name: string, cb: OperatorEvaluator<TFactValue, TJsonValue>, factValueValidator?: (factValue: TFactValue) => boolean) {
    this.name = String(name);
    if (!name) throw new Error("Missing operator name");
    if (typeof cb !== "function") throw new Error("Missing operator callback");
    this.cb = cb;
    this.factValueValidator = factValueValidator || (() => true);
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the callback
   * @param   {mixed} factValue - fact result
   * @param   {mixed} jsonValue - "value" property of the condition
   * @returns {Boolean} - whether the values pass the operator test
   */
  evaluate(factValue: TFactValue, jsonValue: TJsonValue): boolean {
    return this.factValueValidator(factValue) && this.cb(factValue, jsonValue);
  }
}
