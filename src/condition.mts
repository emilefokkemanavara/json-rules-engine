import { AllConditions, AnyConditions, ConditionPropertiesResult, ConditionReference, NestedCondition, NotConditions, TopLevelConditionResultSerializable } from "../types";
import debug from "./debug.mjs";

function isAll(properties: NestedCondition): properties is AllConditions{
  return (properties as AllConditions).all !== undefined;
}

function isAny(properties: NestedCondition): properties is AnyConditions{
  return (properties as AnyConditions).any !== undefined;
}

function isNot(properties: NestedCondition): properties is NotConditions{
  return (properties as NotConditions).not !== undefined;
}

function isConditionReference(properties: NestedCondition): properties is ConditionReference{
  return (properties as ConditionReference).condition !== undefined;
}

export interface StringifyableConditionResult {
  toJSON(): string
  toJSON<T extends boolean>(
    stringify: T
  ): T extends true ? string : TopLevelConditionResultSerializable | ConditionPropertiesResult
}

export interface StringifyableTopLevelConditionResult {
  toJSON(): string
  toJSON<T extends boolean>(
    stringify: T
  ): T extends true ? string : TopLevelConditionResultSerializable
}

export default class Condition implements StringifyableConditionResult {
  fact?: string;
  operator?: string;
  value?: unknown;
  path?: string;
  priority?: number;
  params?: Record<string, unknown>;
  name?: string;
  any?: Condition[]
  all?: Condition[]
  not?: Condition
  result?: boolean
  factResult?: unknown
  valueResult?: unknown
  condition?: string
  constructor(properties: NestedCondition) {
    if (!properties) throw new Error("Condition: constructor options required");
    const booleanOperator = Condition.booleanOperator(properties);
    Object.assign(this, properties);
    if(isAny(properties)){
      const subConditions = properties.any;
      if (!Array.isArray(subConditions)) {
        throw new Error(`"any" must be an array`);
      }
      this.operator = 'any';
      // boolean conditions always have a priority; default 1
      this.priority = parseInt(properties.priority as unknown as string, 10) || 1;
      this.any = subConditions.map((c) => new Condition(c));
    } else if (isAll(properties)){
      const subConditions = properties.all;
      if (!Array.isArray(subConditions)) {
        throw new Error(`"all" must be an array`);
      }
      this.operator = 'all';
      // boolean conditions always have a priority; default 1
      this.priority = parseInt(properties.priority as unknown as string, 10) || 1;
      this.all = subConditions.map((c) => new Condition(c));
    }
    else if (isNot(properties)) {
      const subConditions = properties.not;
      if (Array.isArray(subConditions)) {
        throw new Error(`"not" cannot be an array`);
      }
      this.operator = booleanOperator;
      // boolean conditions always have a priority; default 1
      this.priority = parseInt(properties.priority as unknown as string, 10) || 1;
      this.not = new Condition(subConditions);
    } else if (!isConditionReference(properties)) {
      if (!Object.prototype.hasOwnProperty.call(properties, "fact")) {
        throw new Error('Condition: constructor "fact" property required');
      }
      if (!Object.prototype.hasOwnProperty.call(properties, "operator")) {
        throw new Error('Condition: constructor "operator" property required');
      }
      if (!Object.prototype.hasOwnProperty.call(properties, "value")) {
        throw new Error('Condition: constructor "value" property required');
      }

      // a non-boolean condition does not have a priority by default. this allows
      // priority to be dictated by the fact definition
      if (Object.prototype.hasOwnProperty.call(properties, "priority")) {
        properties.priority = parseInt(properties.priority as unknown as string, 10);
      }
    }
  }

  private toSerializable(): TopLevelConditionResultSerializable | ConditionPropertiesResult{
    if(isAny(this as NestedCondition)){
      return {
        priority: this.priority,
        name: this.name,
        any: (this.any || []).map(c => c.toSerializable())
      }
    }
    if(isAll(this as NestedCondition)){
      return {
        priority: this.priority,
        name: this.name,
        all: (this.all || []).map(c => c.toSerializable())
      }
    }
    if(isNot(this as NestedCondition)){
      return {
        priority: this.priority,
        name: this.name,
        not: this.not!.toSerializable()
      }
    }
    if(isConditionReference(this as NestedCondition)){
      return {
        name: this.name,
        priority: this.priority,
        condition: this.condition!
      }
    }
    return {
      priority: this.priority,
      name: this.name,
      operator: this.operator!,
      value: this.value,
      fact: this.fact!,
      factResult: this.factResult,
      valueResult: this.valueResult,
      result: this.result,
      params: this.params,
      path: this.path
    }
  }

  /**
   * Converts the condition into a json-friendly structure
   * @param   {Boolean} stringify - whether to return as a json string
   * @returns {string,object} json string or json-friendly object
   */
  toJSON(): string
  toJSON(stringify = true): TopLevelConditionResultSerializable | ConditionPropertiesResult | string {
    const props = this.toSerializable();
    if (stringify) {
      return JSON.stringify(props);
    }
    return props;
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the operator
   *   LHS                      OPER       RHS
   * <fact + params + path>  <operator>  <value>
   *
   * @param   {Almanac} almanac
   * @param   {Map} operatorMap - map of available operators, keyed by operator name
   * @returns {Boolean} - evaluation result
   */
  evaluate(almanac, operatorMap) {
    if (!almanac) return Promise.reject(new Error("almanac required"));
    if (!operatorMap) return Promise.reject(new Error("operatorMap required"));
    if (this.isBooleanOperator()) {
      return Promise.reject(new Error("Cannot evaluate() a boolean condition"));
    }

    const op = operatorMap.get(this.operator);
    if (!op) {
      return Promise.reject(new Error(`Unknown operator: ${this.operator}`));
    }

    return Promise.all([
      almanac.getValue(this.value),
      almanac.factValue(this.fact, this.params, this.path),
    ]).then(([rightHandSideValue, leftHandSideValue]) => {
      const result = op.evaluate(leftHandSideValue, rightHandSideValue);
      debug("condition::evaluate", {
        leftHandSideValue,
        operator: this.operator,
        rightHandSideValue,
        result,
      });
      return {
        result,
        leftHandSideValue,
        rightHandSideValue,
        operator: this.operator,
      };
    });
  }

  /**
   * Returns the boolean operator for the condition
   * If the condition is not a boolean condition, the result will be 'undefined'
   * @return {string 'all', 'any', or 'not'}
   */
  static booleanOperator(condition: NestedCondition) {
    if (isAny(condition)) {
      return "any";
    } else if (isAll(condition)) {
      return "all";
    } else if (isNot(condition)) {
      return "not";
    }
  }

  /**
   * Returns the condition's boolean operator
   * Instance version of Condition.isBooleanOperator
   * @returns {string,undefined} - 'any', 'all', 'not' or undefined (if not a boolean condition)
   */
  booleanOperator() {
    return Condition.booleanOperator(this as NestedCondition);
  }

  /**
   * Whether the operator is boolean ('all', 'any', 'not')
   * @returns {Boolean}
   */
  isBooleanOperator() {
    return Condition.booleanOperator(this as NestedCondition) !== undefined;
  }

  /**
   * Whether the condition represents a reference to a condition
   * @returns {Boolean}
   */
  isConditionReference() {
    return this.condition !== undefined;
  }
}
