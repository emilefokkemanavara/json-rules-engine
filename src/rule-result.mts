import { RuleResult as RuleResultType, TopLevelConditionResult, Event, RuleResultSerializable } from '../types'
import deepClone from "clone";
import { StringifyableTopLevelConditionResult } from './condition.mjs';

export default class RuleResult implements RuleResultType{
  name: string
  conditions: TopLevelConditionResult & StringifyableTopLevelConditionResult;
  event: Event
  priority: number
  result: unknown
  constructor(conditions: TopLevelConditionResult & StringifyableTopLevelConditionResult, event: Event, priority: number, name: string) {
    this.conditions = deepClone(conditions);
    this.event = deepClone(event);
    this.priority = deepClone(priority);
    this.name = deepClone(name);
    this.result = null;
  }

  setResult(result: unknown): void {
    this.result = result;
  }

  resolveEventParams(almanac) {
    if (this.event.params !== null && typeof this.event.params === "object") {
      const updates = [];
      for (const key in this.event.params) {
        if (Object.prototype.hasOwnProperty.call(this.event.params, key)) {
          updates.push(
            almanac
              .getValue(this.event.params[key])
              .then((val) => (this.event.params[key] = val)),
          );
        }
      }
      return Promise.all(updates);
    }
    return Promise.resolve();
  }

  toJSON(): string
  toJSON(stringify = true): RuleResultSerializable | string {
    const props: RuleResultSerializable = {
      conditions: this.conditions.toJSON(false),
      event: this.event,
      priority: this.priority,
      name: this.name,
      result: this.result,
    };
    if (stringify) {
      return JSON.stringify(props);
    }
    return props;
  }
}
