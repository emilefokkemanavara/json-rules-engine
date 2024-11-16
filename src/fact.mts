import { DynamicFactCallback, FactOptions, Fact as FactType, Almanac } from '../types'
import hash from "hash-it";

class Fact<T = unknown> implements FactType<T> {
  id: string;
  priority: number;
  options: FactOptions;
  value?: T;
  calculationMethod?: DynamicFactCallback<T>;
  type: string
  cacheKeyMethod: (id: string, params: Record<string, unknown>) => unknown
  /**
   * Returns a new fact instance
   * @param  {string} id - fact unique identifer
   * @param  {object} options
   * @param  {boolean} options.cache - whether to cache the fact's value for future rules
   * @param  {primitive|function} valueOrMethod - constant primitive, or method to call when computing the fact's value
   * @return {Fact}
   */
  constructor(id: string, valueOrMethod: T | DynamicFactCallback<T>, options?: FactOptions) {
    this.id = id;
    const defaultOptions = { cache: true };
    if (typeof options === "undefined") {
      options = defaultOptions;
    }
    if (typeof valueOrMethod !== "function") {
      this.value = valueOrMethod;
      this.type = Fact.CONSTANT;
    } else {
      this.calculationMethod = valueOrMethod as DynamicFactCallback<T>;
      this.type = Fact.DYNAMIC;
    }

    if (!this.id) throw new Error("factId required");

    this.priority = parseInt((options.priority || 1) as unknown as string, 10);
    this.options = Object.assign({}, defaultOptions, options);
    this.cacheKeyMethod = this.defaultCacheKeys;
    return this;
  }

  isConstant() {
    return this.type === Fact.CONSTANT;
  }

  isDynamic() {
    return this.type === Fact.DYNAMIC;
  }

  /**
   * Return the fact value, based on provided parameters
   * @param  {object} params
   * @param  {Almanac} almanac
   * @return {any} calculation method results
   */
  calculate(params: Record<string, unknown>, almanac: Almanac): T {
    if(this.calculationMethod !== undefined){
      return this.calculationMethod(params, almanac);
    }
    return this.value as T;
  }

  /**
   * Return a cache key (MD5 string) based on parameters
   * @param  {object} obj - properties to generate a hash key from
   * @return {string} MD5 string based on the hash'd object
   */
  static hashFromObject(obj: unknown): number {
    return hash(obj);
  }

  /**
   * Default properties to use when caching a fact
   * Assumes every fact is a pure function, whose computed value will only
   * change when input params are modified
   * @param  {string} id - fact unique identifer
   * @param  {object} params - parameters passed to fact calcution method
   * @return {object} id + params
   */
  defaultCacheKeys(id: string, params: Record<string, unknown>): unknown {
    return { params, id };
  }

  /**
   * Generates the fact's cache key(MD5 string)
   * Returns nothing if the fact's caching has been disabled
   * @param  {object} params - parameters that would be passed to the computation method
   * @return {string} cache key
   */
  getCacheKey(params: Record<string, unknown>) {
    if (this.options.cache === true) {
      const cacheProperties = this.cacheKeyMethod(this.id, params);
      const hash = Fact.hashFromObject(cacheProperties);
      return hash;
    }
  }

  static CONSTANT: string = 'CONSTANT'
  static DYNAMIC: string = 'DYNAMIC'
}

//Fact.CONSTANT = "CONSTANT";
//Fact.DYNAMIC = "DYNAMIC";

export default Fact;
