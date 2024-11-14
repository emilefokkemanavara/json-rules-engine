import { OperatorDecoratorEvaluator, OperatorDecorator as OperatorDecoratorType, Operator as OperatorType } from '../types'
import Operator from "./operator.mjs";

export interface InternalOperatorDecoratorType<
  TFactValue = unknown,
  TJsonValue = unknown,
  TNextFactValue = unknown,
  TNextJsonValue = unknown
> extends OperatorDecoratorType<TFactValue, TJsonValue, TNextFactValue, TNextJsonValue>{
  decorate(operator: OperatorType): OperatorType
}

export default class OperatorDecorator<
  TFactValue = unknown,
  TJsonValue = unknown,
  TNextFactValue = unknown,
  TNextJsonValue = unknown> implements InternalOperatorDecoratorType<TFactValue, TJsonValue, TNextFactValue, TNextJsonValue> {
  name: string
  private cb: OperatorDecoratorEvaluator<TFactValue, TJsonValue, TNextFactValue, TNextJsonValue>
  private factValueValidator: (factValue: TFactValue) => boolean
  /**
   * Constructor
   * @param {string}   name - decorator identifier
   * @param {function(factValue, jsonValue, next)} callback - callback that takes the next operator as a parameter
   * @param {function}  [factValueValidator] - optional validator for asserting the data type of the fact
   * @returns {OperatorDecorator} - instance
   */
  constructor(
    name: string,
    cb: OperatorDecoratorEvaluator<TFactValue, TJsonValue, TNextFactValue, TNextJsonValue>,
    factValueValidator?: (factValue: TFactValue) => boolean) {
      this.name = String(name);
      if (!name) throw new Error("Missing decorator name");
      if (typeof cb !== "function") throw new Error("Missing decorator callback");
      this.cb = cb;
      this.factValueValidator = factValueValidator || (() => true);
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the callback
   * @param   {Operator} operator - fact result
   * @returns {Operator} - whether the values pass the operator test
   */
  decorate(operator: Operator<TNextFactValue, TNextJsonValue>): Operator<TFactValue, TJsonValue> {
    const next = operator.evaluate.bind(operator);
    return new Operator<TFactValue, TJsonValue>(
      `${this.name}:${operator.name}`,
      (factValue, jsonValue) => {
        return this.cb(factValue, jsonValue, next);
      },
      this.factValueValidator,
    );
  }
}
