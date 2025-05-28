'use strict'

import hash from 'hash-it'
import { DynamicFactCallback, FactOptions, Fact as FactClass } from '../types'

interface FactBase {
  id: string
  type: 'CONSTANT' | 'DYNAMIC'
  priority: number
  options: FactOptions
  isConstant(): boolean
  isDynamic(): boolean
}

class DynamicFact<T = unknown> implements FactBase, FactClass<T> {
  type = 'DYNAMIC' as const
  constructor(
    public id: string,
    public calculationMethod: DynamicFactCallback<T>,
    public options: FactOptions,
    public priority: number
  ){

  }
  isConstant(): boolean {
    return false;
  }
  isDynamic(): boolean {
    return true;
  }
}

class ConstantFact<T> implements FactBase {
  type = 'CONSTANT' as const
  constructor(
    public id: string,
    public value: T,
    public options: FactOptions,
    public priority: number
  ){

  }
  isConstant(): boolean {
    return true;
  }
  isDynamic(): boolean {
    return false;
  }
}

class Fact<T = unknown> implements FactClass<T>{
  private factBase: FactBase;
  cacheKeyMethod

  get id(): string{
    return this.factBase.id;
  }

  get options(): FactOptions {
    return this.factBase.options;
  }

  get priority(): number {
    return this.factBase.priority;
  }

  get value(): T {
    if(this.factBase instanceof ConstantFact){
      return this.factBase.value;
    }
  }

  get calculationMethod(): DynamicFactCallback<T> | undefined {
    if(this.factBase instanceof DynamicFact){
      return this.factBase.calculationMethod
    }
  }

  get type(): 'CONSTANT' | 'DYNAMIC' {
    return this.factBase.type;
  }
  /**
   * Returns a new fact instance
   * @param  {string} id - fact unique identifer
   * @param  {object=} options
   * @param  {boolean} options.cache - whether to cache the fact's value for future rules
   * @param  {primitive|function} valueOrMethod - constant primitive, or method to call when computing the fact's value
   * @return {Fact}
   */
  constructor (id: string, valueOrMethod: T | DynamicFactCallback<T>, options?: FactOptions) {
    const defaultOptions = { cache: true }
    if (!id) throw new Error('factId required')
    if (typeof options === 'undefined') {
      options = defaultOptions
    }
    const priority = (typeof options.priority === 'string' ? parseInt(options.priority, 10) : options.priority) || 1;
    const fullOptions = Object.assign({}, defaultOptions, options)
    this.cacheKeyMethod = this.defaultCacheKeys
    if (typeof valueOrMethod !== 'function') {
      this.factBase = new ConstantFact(
        id,
        valueOrMethod,
        fullOptions,
        priority
      )
    } else {
      this.factBase = new DynamicFact(
        id,
        valueOrMethod as DynamicFactCallback<T>,
        fullOptions,
        priority
      )
    }
  }

  isConstant () {
    return this.factBase.isConstant();
  }

  isDynamic () {
    return this.factBase.isDynamic();
  }

  /**
   * Return the fact value, based on provided parameters
   * @param  {object} params
   * @param  {Almanac} almanac
   * @return {any} calculation method results
   */
  calculate(): T
  calculate (params, almanac): T
  calculate (params?, almanac?): T {
    if(this.factBase instanceof DynamicFact){
      return this.factBase.calculationMethod(params, almanac);
    }
    if(this.factBase instanceof ConstantFact){
      return this.factBase.value;
    }
  }

  /**
   * Return a cache key (MD5 string) based on parameters
   * @param  {object} obj - properties to generate a hash key from
   * @return {string} MD5 string based on the hash'd object
   */
  static hashFromObject (obj) {
    return hash(obj)
  }

  /**
   * Default properties to use when caching a fact
   * Assumes every fact is a pure function, whose computed value will only
   * change when input params are modified
   * @param  {string} id - fact unique identifer
   * @param  {object} params - parameters passed to fact calcution method
   * @return {object} id + params
   */
  defaultCacheKeys (id, params) {
    return { params, id }
  }

  /**
   * Generates the fact's cache key(MD5 string)
   * Returns nothing if the fact's caching has been disabled
   * @param  {object} params - parameters that would be passed to the computation method
   * @return {string} cache key
   */
  getCacheKey (params) {
    if (this.factBase.options.cache === true) {
      const cacheProperties = this.cacheKeyMethod(this.factBase.id, params)
      const hash = Fact.hashFromObject(cacheProperties)
      return hash
    }
  }

  static CONSTANT = 'CONSTANT'
  static DYNAMIC = 'DYNAMIC'
}

export default Fact
