import conditionFactory from "./support/condition-factory"
import ruleFactory from "./support/rule-factory"


declare global {
    var expect: Chai.ExpectStatic
    var factories: {
        condition: typeof conditionFactory
        rule: typeof ruleFactory
    }
}

export {}