import OperatorDecorator, { InternalOperatorDecoratorType } from "./operator-decorator.mjs";

const OperatorDecorators: InternalOperatorDecoratorType[] = [];

OperatorDecorators.push(
  new OperatorDecorator<unknown[], unknown>(
    "someFact",
    (factValue, jsonValue, next) => factValue.some((fv) => next(fv, jsonValue)),
    Array.isArray,
  ),
);
OperatorDecorators.push(
  new OperatorDecorator<unknown, unknown[]>("someValue", (factValue, jsonValue, next) =>
    jsonValue.some((jv) => next(factValue, jv)),
  ),
);
OperatorDecorators.push(
  new OperatorDecorator<unknown[], unknown>(
    "everyFact",
    (factValue, jsonValue, next) =>
      factValue.every((fv) => next(fv, jsonValue)),
    Array.isArray,
  ),
);
OperatorDecorators.push(
  new OperatorDecorator<unknown, unknown[]>("everyValue", (factValue, jsonValue, next) =>
    jsonValue.every((jv) => next(factValue, jv)),
  ),
);
OperatorDecorators.push(
  new OperatorDecorator("swap", (factValue, jsonValue, next) =>
    next(jsonValue, factValue),
  ),
);
OperatorDecorators.push(
  new OperatorDecorator(
    "not",
    (factValue, jsonValue, next) => !next(factValue, jsonValue),
  ),
);

export default OperatorDecorators;
