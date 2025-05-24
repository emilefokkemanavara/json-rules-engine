'use strict'

import { Operator } from '../src/index'

describe('Operator', () => {
  describe('constructor()', () => {
    function subject (name, cb, factValueValidator?) {
      return new Operator(name, cb, factValueValidator)
    }

    it('adds the operator', () => {
      const operator = subject('startsWithLetter', (factValue, jsonValue) => {
        return factValue[0] === jsonValue
      })
      expect(operator.name).to.equal('startsWithLetter')
      expect(operator.cb).to.an.instanceof(Function)
    })

    it('operator name', () => {
      expect(() => {
        (subject as any)()
      }).to.throw(/Missing operator name/)
    })

    it('operator definition', () => {
      expect(() => {
        (subject as any)('startsWithLetter')
      }).to.throw(/Missing operator callback/)
    })
  })
})
