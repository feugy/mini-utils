const Lab = require('lab')
const Joi = require('joi')
const assert = require('power-assert')
const rewire = require('rewire')
const utils = rewire('../')

const lab = exports.lab = Lab.script()
const {describe, it, beforeEach} = lab

describe('Utilities', () => {

  /* eslint no-empty-function: 0 */
  const noop = () => {}

  describe('extractValidate', () => {

    it('should extract from api.validate', done => {
      const id = 'test'
      const apis = {
        [id]: () => {}
      }
      const validation = Joi.array()
      apis[id].validate = validation
      assert.deepStrictEqual(utils.extractValidate(id, apis), validation)
      done()
    })

    it('should extract from opts.validate', done => {
      const id = 'test2'
      const apis = {
        [id]: () => {}
      }
      const validation = Joi.array()
      assert.deepStrictEqual(utils.extractValidate(id, apis, {validate: validation}), validation)
      done()
    })

    it('should not fail on missing validate key', done => {
      const id = 'test3'
      const apis = {
        [id]: () => {}
      }
      assert.strictEqual(utils.extractValidate(id, apis, {}), null)
      done()
    })

    it('should not fail on missing options', done => {
      const id = 'test4'
      const apis = {
        [id]: () => {}
      }
      assert.strictEqual(utils.extractValidate(id, apis), null)
      done()
    })
  })

  describe('getLogger', () => {

    beforeEach(done => {
      utils.__set__('logger', null)
      done()
    })

    it('should create a bunyan logger', done => {
      const logger = utils.getLogger()
      assert(logger)
      assert(logger.debug)
      assert.equal(logger.fields.name, 'mini-service-utils')
      done()
    })

    it('should reuse the same instance', done => {
      assert.strictEqual(utils.getLogger(), utils.getLogger())
      done()
    })

    it('should be customizable', done => {
      const logger = utils.getLogger({name: 'toto'})
      assert(logger)
      assert(logger.debug)
      assert.equal(logger.fields.name, 'toto')
      done()
    })
  })

  describe('arrayToObj', () => {

    it('should transform an array to an object', done => {
      assert.deepStrictEqual(utils.arrayToObj([1, 2], ['count', 'other']), {count: 1, other: 2})
      done()
    })

    it('should keep unexpected items in result', done => {
      assert.deepStrictEqual(utils.arrayToObj([1, 2, 3, 'haha'], ['count', 'other']), {
        count: 1,
        other: 2,
        2: 3,
        3: 'haha'
      })
      done()
    })
  })

  describe('isApi', () => {

    it('should allow empty object', done => {
      assert(utils.isApi({}))
      done()
    })

    it('should allow plain object', done => {
      assert(utils.isApi({method: () => {}, attribute: 1}))
      done()
    })

    it('should allow class instances', done => {
      class Service {
        method() {}
      }
      assert(utils.isApi(new Service()))
      done()
    })

    it('should not allow falsy values', done => {
      assert.equal(utils.isApi(), false)
      assert.equal(utils.isApi(null), false)
      assert.equal(utils.isApi(''), false)
      assert.equal(utils.isApi(false), false)
      assert.equal(utils.isApi(0), false)
      done()
    })

    it('should not allow string and numbers values', done => {
      assert.equal(utils.isApi('hi'), false)
      assert.equal(utils.isApi(10), false)
      done()
    })

    it('should not allow arrays', done => {
      assert.equal(utils.isApi([]), false)
      assert.equal(utils.isApi([1, 2]), false)
      done()
    })
  })

  describe('validateParams', () => {

    it('should fails when giving more parameters than expexted', done => {
      const error = utils.validateParams({count: 1, other: 2}, Joi.object(), 'test', 1)
      assert(error)
      assert.equal(error.message, 'API test must contain at most 1 parameters')
      done()
    })

    it('should report validation errors', done => {
      const error = utils.validateParams({count: 1}, Joi.object({other: Joi.string().required()}), 'test', 1)
      assert(error)
      assert(error.message.includes('API test'))
      assert(error.message.includes('"other" is required]'))
      done()
    })

    it('should allow valid invokations', done => {
      const error = utils.validateParams({count: 1}, Joi.object({count: Joi.number().required()}), 'test', 1)
      assert.strictEqual(error, null)
      done()
    })
  })

  describe('getParamNames', () => {

    it('should fails on null', done => {
      assert.throws(() => utils.getParamNames(null), /unsupported function null/)
      done()
    })

    it('should fails on undefined', done => {
      assert.throws(() => utils.getParamNames(), /unsupported function undefined/)
      done()
    })

    it('should fails on object', done => {
      assert.throws(() => utils.getParamNames({}), /unsupported function \[object Object\]/)
      done()
    })

    it('should fails on rest parameter', done => {
      assert.throws(() => utils.getParamNames((...args) => {}), /unsupported function \(\.\.\.args\)/)
      done()
    })

    it('should handle typical function', done => {
      const obj = {
        ping() {
          return Promise.resolve({time: new Date()})
        }
      }
      assert.deepStrictEqual(utils.getParamNames(obj.ping), [])
      done()
    })

    it('should handle empty function declaration', done => {
      /* eslint prefer-arrow-callback: 0 */
      function declared() {
        noop()
      }
      assert.deepStrictEqual(utils.getParamNames(declared), [])
      done()
    })

    it('should handle empty anonymous function', done => {
      /* eslint prefer-arrow-callback: 0 */
      assert.deepStrictEqual(utils.getParamNames(function() {
        noop()
      }), [])
      done()
    })

    it('should handle named function', done => {
      /* eslint prefer-arrow-callback: 0 */
      assert.deepStrictEqual(utils.getParamNames(function named() {
        noop()
      }), [])
      done()
    })

    it('should handle empty arrow function', done => {
      assert.deepStrictEqual(utils.getParamNames(() => {
        noop()
      }), [])
      done()
    })

    it('should handle function declaration with single parameter', done => {
      /* eslint prefer-arrow-callback: 0 */
      function declared(a) {
        noop()
      }
      assert.deepStrictEqual(utils.getParamNames(declared), ['a'])
      done()
    })

    it('should handle anonymous function with single parameter', done => {
      /* eslint prefer-arrow-callback: 0,  no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function(a) {
        noop()
      }), ['a'])
      done()
    })

    it('should handle named function with single parameter', done => {
      /* eslint prefer-arrow-callback: 0, no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function named(a) {
        noop()
      }), ['a'])
      done()
    })

    it('should handle empty arrow function with single parameter', done => {
      /* eslint no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(a => {
        noop()
      }), ['a'])
      done()
    })

    it('should handle function declaration with multiple parameter', done => {
      /* eslint prefer-arrow-callback: 0 */
      function declared(a, b, c) {
        noop()
      }
      assert.deepStrictEqual(utils.getParamNames(declared), ['a', 'b', 'c'])
      done()
    })

    it('should handle anonymous function with multiple parameters', done => {
      /* eslint prefer-arrow-callback: 0, no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function(a, b, c) {
        noop()
      }), ['a', 'b', 'c'])
      done()
    })

    it('should handle named function with multiple parameters', done => {
      /* eslint prefer-arrow-callback: 0, no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function named(a, b, c) {
        noop()
      }), ['a', 'b', 'c'])
      done()
    })

    it('should handle empty arrow function with multiple parameters', done => {
      /* eslint no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames((a, b, c) => {
        noop()
      }), ['a', 'b', 'c'])
      done()
    })

    it('should handle function declaration with default values', done => {
      /* eslint prefer-arrow-callback: 0 */
      function declared(a, b, c = false) {
        noop()
      }
      assert.deepStrictEqual(utils.getParamNames(declared), ['a', 'b', 'c'])
      done()
    })

    it('should handle anonymous function with default values', done => {
      /* eslint prefer-arrow-callback: 0, no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function(a, b, c = 10) {
        noop()
      }), ['a', 'b', 'c'])
      done()
    })

    it('should handle named function with default values', done => {
      /* eslint prefer-arrow-callback: 0, no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function named(a, b, c = null) {
        noop()
      }), ['a', 'b', 'c'])
      done()
    })

    it('should handle empty arrow function with default values', done => {
      /* eslint no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames((a, b, c = []) => {
        noop()
      }), ['a', 'b', 'c'])
      done()
    })
  })

  describe('extractGroups', () => {

    it('should get group from parameters', done => {
      const name = 'test'
      const init = noop
      assert.deepStrictEqual(utils.extractGroups({name, init}), {
        groups: [{name, init}],
        groupOpts: {[name]: {name, init}}
      })
      done()
    })

    it('should get groups from property', done => {
      const name1 = 'test1'
      const init1 = noop
      const name2 = 'test2'
      const init2 = noop
      assert.deepStrictEqual(utils.extractGroups({
        groups: [{name: name1, init: init1}, {name: name1, init: init1}]
      }), {
        groups: [{name: name1, init: init1}, {name: name1, init: init1}],
        groupOpts: {}
      })
      done()
    })

    it('should get group options from property', done => {
      const name1 = 'test1'
      const init1 = noop
      const name2 = 'test2'
      const init2 = noop
      assert.deepStrictEqual(utils.extractGroups({
        groups: [{name: name1, init: init1}, {name: name1, init: init1}],
        groupOpts: {[name1]: {name: name1}, [name2]: {name: name2}}
      }), {
        groups: [{name: name1, init: init1}, {name: name1, init: init1}],
        groupOpts: {[name1]: {name: name1}, [name2]: {name: name2}}
      })
      done()
    })

    it('should fail if no group found', done => {
      assert.throws(() => utils.extractGroups({name: 'test'}), /No APIs nor APIs groups defined/)
      done()
    })

    it('should fail on invalid group found', done => {
      assert.throws(() => utils.extractGroups({groups: ['not a group']}), /Group definition at position 0/)
      done()
    })
  })
})
