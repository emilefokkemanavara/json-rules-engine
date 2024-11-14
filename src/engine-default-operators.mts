import {Operator as OperatorType} from '../types'
import Operator from "./operator.mjs";

const Operators: OperatorType[] = [];
Operators.push(new Operator("equal", (a, b) => a === b));
Operators.push(new Operator("notEqual", (a, b) => a !== b));
Operators.push(new Operator<unknown, unknown[]>("in", (a, b) => b.indexOf(a) > -1));
Operators.push(new Operator<unknown, unknown[]>("notIn", (a, b) => b.indexOf(a) === -1));

Operators.push(
  new Operator("contains", (a, b) => a.indexOf(b) > -1, Array.isArray),
);
Operators.push(
  new Operator("doesNotContain", (a, b) => a.indexOf(b) === -1, Array.isArray),
);

function numberValidator(factValue: unknown): boolean {
  if(typeof factValue === 'number'){
    return true;
  }
  if(typeof factValue !== 'string'){
    return false;
  }
  return Number.parseFloat(factValue).toString() !== "NaN";
}
Operators.push(new Operator<unknown, number>("lessThan", (a, b) => a as number < b, numberValidator));
Operators.push(
  new Operator<unknown, number>("lessThanInclusive", (a, b) => a as number <= b, numberValidator),
);
Operators.push(new Operator<unknown, number>("greaterThan", (a, b) => a as number > b, numberValidator));
Operators.push(
  new Operator<unknown, number>("greaterThanInclusive", (a, b) => a as number >= b, numberValidator),
);

export default Operators;
