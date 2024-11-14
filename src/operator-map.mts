import { OperatorDecoratorEvaluator, OperatorEvaluator} from '../types'
import Operator, { InternalOperatorType } from "./operator.mjs";
import OperatorDecorator, { InternalOperatorDecoratorType } from "./operator-decorator.mjs";
import debug from "./debug.mjs";

export default class OperatorMap {
  operators: Map<string, InternalOperatorType>
  decorators: Map<string, InternalOperatorDecoratorType>
  constructor() {
    this.operators = new Map();
    this.decorators = new Map();
  }

  /**
   * Add a custom operator definition
   * @param {string}   operatorOrName - operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
   * @param {function(factValue, jsonValue)} callback - the method to execute when the operator is encountered.
   */
  addOperator<A, B>(operatorOrName: string | Operator, cb?: OperatorEvaluator<A, B>): void {
    let operator;
    if (operatorOrName instanceof Operator) {
      operator = operatorOrName;
    } else if (cb) {
      operator = new Operator(operatorOrName, cb);
    } else {
      throw new Error("Missing operator callback");
    }
    debug("operatorMap::addOperator", { name: operator.name });
    this.operators.set(operator.name, operator);
  }

  /**
   * Remove a custom operator definition
   * @param {string}   operatorOrName - operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
   * @param {function(factValue, jsonValue)} callback - the method to execute when the operator is encountered.
   */
  removeOperator(operatorOrName: InternalOperatorType | string): boolean {
    let operatorName: string;
    if (typeof operatorOrName === 'string') {
      operatorName = operatorOrName;
    } else {
      operatorName = operatorOrName.name;
    }

    // Delete all the operators that end in :operatorName these
    // were decorated on-the-fly leveraging this operator
    const suffix = ":" + operatorName;
    const operatorNames = Array.from(this.operators.keys());
    for (let i = 0; i < operatorNames.length; i++) {
      if (operatorNames[i].endsWith(suffix)) {
        this.operators.delete(operatorNames[i]);
      }
    }

    return this.operators.delete(operatorName);
  }

  /**
   * Add a custom operator decorator
   * @param {string}   decoratorOrName - decorator identifier within the condition; i.e. instead of 'everyFact', 'someValue', etc
   * @param {function(factValue, jsonValue, next)} callback - the method to execute when the decorator is encountered.
   */
  addOperatorDecorator<A, B, NextA, NextB>(
    decoratorOrName: string | OperatorDecorator,
    cb?: OperatorDecoratorEvaluator<A, B, NextA, NextB>): void {
    let decorator;
    if (decoratorOrName instanceof OperatorDecorator) {
      decorator = decoratorOrName;
    } else if (cb) {
      decorator = new OperatorDecorator(decoratorOrName, cb);
    } else {
      throw new Error("Missing decorator callback");
    }
    debug("operatorMap::addOperatorDecorator", { name: decorator.name });
    this.decorators.set(decorator.name, decorator);
  }

  /**
   * Remove a custom operator decorator
   * @param {string}   decoratorOrName - decorator identifier within the condition; i.e. instead of 'everyFact', 'someValue', etc
   */
  removeOperatorDecorator(decoratorOrName: InternalOperatorDecoratorType | string): boolean {
    let decoratorName: string;
    if (typeof decoratorOrName === 'string') {
      decoratorName = decoratorOrName;
    } else {
      decoratorName = decoratorOrName.name;
    }

    // Delete all the operators that include decoratorName: these
    // were decorated on-the-fly leveraging this decorator
    const prefix = decoratorName + ":";
    const operatorNames = Array.from(this.operators.keys());
    for (let i = 0; i < operatorNames.length; i++) {
      if (operatorNames[i].includes(prefix)) {
        this.operators.delete(operatorNames[i]);
      }
    }

    return this.decorators.delete(decoratorName);
  }

  /**
   * Get the Operator, or null applies decorators as needed
   * @param {string} name - the name of the operator including any decorators
   * @returns an operator or null
   */
  get(name: string): InternalOperatorType | null {
    const decorators = [];
    let opName = name;
    // while we don't already have this operator
    while (!this.operators.has(opName)) {
      // try splitting on the decorator symbol (:)
      const firstDecoratorIndex = opName.indexOf(":");
      if (firstDecoratorIndex > 0) {
        // if there is a decorator, and it's a valid decorator
        const decoratorName = opName.slice(0, firstDecoratorIndex);
        const decorator = this.decorators.get(decoratorName);
        if (!decorator) {
          debug("operatorMap::get invalid decorator", { name: decoratorName });
          return null;
        }
        // we're going to apply this later, use unshift since we'll apply in reverse order
        decorators.unshift(decorator);
        // continue looking for a known operator with the rest of the name
        opName = opName.slice(firstDecoratorIndex + 1);
      } else {
        debug("operatorMap::get no operator", { name: opName });
        return null;
      }
    }

    let op = this.operators.get(opName);
    if(!op){
      return null;
    }
    // apply all the decorators
    for (let i = 0; i < decorators.length; i++) {
      op = decorators[i].decorate(op);
      // create an entry for the decorated operation so we don't need
      // to do this again
      this.operators.set(op.name, op);
    }
    // return the operation
    return op;
  }
}
