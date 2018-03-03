const Lab = require('lab')
const Joi = require('joi')
const {badRequest} = require('boom')
const assert = require('power-assert')
const rewire = require('rewire')
const utils = rewire('../')

const lab = exports.lab = Lab.script()
const {describe, it, beforeEach} = lab

describe('Utilities', () => {
  /* eslint no-empty-function: 0 */
  const noop = () => {}

  describe('extractValidate', () => {
    it('should extract from api.validate', () => {
      const id = 'test'
      const apis = {
        [id]: () => {}
      }
      const validation = Joi.array()
      apis[id].validate = validation
      assert.deepStrictEqual(utils.extractValidate(id, apis), validation)
    })

    it('should extract another clause from api', () => {
      const id = 'test5'
      const apis = {
        [id]: () => {}
      }
      const validation = Joi.array()
      apis[id].responseSchema = validation
      assert.deepStrictEqual(utils.extractValidate(id, apis, {}, 'responseSchema'), validation)
    })

    it('should extract from opts.validate', () => {
      const id = 'test2'
      const apis = {
        [id]: () => {}
      }
      const validation = Joi.array()
      assert.deepStrictEqual(utils.extractValidate(id, apis, {validate: validation}), validation)
    })

    it('should extract another clause from opts', () => {
      const id = 'test6'
      const apis = {
        [id]: () => {}
      }
      const validation = Joi.array()
      assert.deepStrictEqual(
        utils.extractValidate(id, apis, {responseSchema: validation}, 'responseSchema'),
        validation
      )
    })

    it('should not fail on missing validate key', () => {
      const id = 'test3'
      const apis = {
        [id]: () => {}
      }
      assert.strictEqual(utils.extractValidate(id, apis, {}), null)
    })

    it('should not fail on missing options', () => {
      const id = 'test4'
      const apis = {
        [id]: () => {}
      }
      assert.strictEqual(utils.extractValidate(id, apis), null)
    })
  })

  describe('getLogger', () => {
    beforeEach(() => {
      utils.__set__('logger', null)
    })

    it('should create a bunyan logger', () => {
      const logger = utils.getLogger()
      assert(logger)
      assert(logger.debug)
      assert.equal(logger.fields.name, 'mini-service-utils')
    })

    it('should reuse the same instance', () => {
      assert.strictEqual(utils.getLogger(), utils.getLogger())
    })

    it('should be customizable', () => {
      const logger = utils.getLogger({name: 'toto'})
      assert(logger)
      assert(logger.debug)
      assert.equal(logger.fields.name, 'toto')
    })
  })

  describe('arrayToObj', () => {
    it('should transform an array to an object', () => {
      assert.deepStrictEqual(utils.arrayToObj([1, 2], ['count', 'other']), {count: 1, other: 2})
    })

    it('should keep unexpected items in result', () => {
      assert.deepStrictEqual(utils.arrayToObj([1, 2, 3, 'haha'], ['count', 'other']), {
        count: 1,
        other: 2,
        2: 3,
        3: 'haha'
      })
    })
  })

  describe('isApi', () => {
    it('should allow empty object', () => {
      assert(utils.isApi({}))
    })

    it('should allow plain object', () => {
      assert(utils.isApi({method: () => {}, attribute: 1}))
    })

    it('should allow class instances', () => {
      class Service {
        method () {}
      }
      assert(utils.isApi(new Service()))
    })

    it('should not allow falsy values', () => {
      assert.equal(utils.isApi(), false)
      assert.equal(utils.isApi(null), false)
      assert.equal(utils.isApi(''), false)
      assert.equal(utils.isApi(false), false)
      assert.equal(utils.isApi(0), false)
    })

    it('should not allow string and numbers values', () => {
      assert.equal(utils.isApi('hi'), false)
      assert.equal(utils.isApi(10), false)
    })

    it('should not allow arrays', () => {
      assert.equal(utils.isApi([]), false)
      assert.equal(utils.isApi([1, 2]), false)
    })
  })

  describe('validateParams - soon deprecated', () => {
    it('should fails when giving more parameters than expexted', () => {
      const error = utils.validateParams({count: 1, other: 2}, Joi.object(), 'test', 1)
      assert(error)
      assert.equal(error.message, 'API test must contain at most 1 parameters')
    })

    it('should report validation errors', () => {
      const error = utils.validateParams({count: 1}, Joi.object({other: Joi.string().required()}), 'test', 1)
      assert(error)
      assert(error.message.includes('API test'))
      assert(error.message.includes('"other" is required]'))
    })

    it('should allow valid invokations', () => {
      const error = utils.validateParams({count: 1}, Joi.object({count: Joi.number().required()}), 'test', 1)
      assert.strictEqual(error, null)
    })
  })

  describe('enrichError', () => {
    const validationError = Joi.object({other: Joi.string().required()}).validate({count: 1}).error

    it('should return null if no error', () => {
      assert(utils.enrichError(null, '') === null)
    })

    it('should return bad request on input validation error', () => {
      const error = utils.enrichError(validationError, 'test-input')
      assert(error.isBoom)
      assert(error.output.payload.statusCode === 400)
      assert(error.output.payload.error === 'Bad Request')
      assert(error.message.includes('Incorrect parameters for API test-input'))
      assert(error.message.includes('"other" is required]'))
    })

    it('should return bad response on result validation error', () => {
      const error = utils.enrichError(validationError, 'test-response', false)
      assert(error.isBoom)
      assert(error.output.payload.statusCode === 512)
      assert(error.output.payload.error === 'Bad Response')
      assert(error.message.includes('Incorrect response for API test-response'))
      assert(error.message.includes('"other" is required]'))
    })

    it('should override boom error', () => {
      const error = utils.enrichError(badRequest(validationError), 'test-override', false)
      assert(error.isBoom)
      assert(error.output.payload.statusCode === 512)
      assert(error.output.payload.error === 'Bad Response')
      assert(error.message.includes('Incorrect response for API test-override'))
      assert(error.message.includes('"other" is required]'))
    })
  })

  describe('getParamNames', () => {
    it('should fails on null', () => {
      assert.throws(() => utils.getParamNames(null), /unsupported function null/)
    })

    it('should fails on undefined', () => {
      assert.throws(() => utils.getParamNames(), /unsupported function undefined/)
    })

    it('should fails on object', () => {
      assert.throws(() => utils.getParamNames({}), /unsupported function \[object Object\]/)
    })

    it('should fails on rest parameter', () => {
      assert.throws(() => utils.getParamNames((...args) => {}), /unsupported function \(\.\.\.args\)/)
    })

    it('should handle function declaration', () => {
      /* eslint prefer-arrow-callback: 0 */
      function declared () {
        noop()
      }
      assert.deepStrictEqual(utils.getParamNames(declared), [])
    })

    it('should handle anonymous function', () => {
      /* eslint prefer-arrow-callback: 0 */
      assert.deepStrictEqual(utils.getParamNames(function () {
        noop()
      }), [])
    })

    it('should handle named function', () => {
      /* eslint prefer-arrow-callback: 0 */
      assert.deepStrictEqual(utils.getParamNames(function named () {
        noop()
      }), [])
    })

    it('should handle arrow function', () => {
      assert.deepStrictEqual(utils.getParamNames(() => {
        noop()
      }), [])
    })

    it('should handle function shortcut', () => {
      const obj = {
        ping () {}
      }
      assert.deepStrictEqual(utils.getParamNames(obj.ping), [])
    })

    it('should handle function declaration with single parameter', () => {
      /* eslint prefer-arrow-callback: 0 */
      function declared (a) {
        noop()
      }
      assert.deepStrictEqual(utils.getParamNames(declared), ['a'])
    })

    it('should handle anonymous function with single parameter', () => {
      /* eslint prefer-arrow-callback: 0,  no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function (a) {
        noop()
      }), ['a'])
    })

    it('should handle named function with single parameter', () => {
      /* eslint prefer-arrow-callback: 0, no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function named (a) {
        noop()
      }), ['a'])
    })

    it('should handle arrow function with single parameter', () => {
      /* eslint no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(a => {
        noop()
      }), ['a'])
    })

    it('should handle async arrow function with single parameter', () => {
      assert.deepStrictEqual(utils.getParamNames(async a => {
        noop()
      }), ['a'])
    })

    it('should handle function shortcut with single parameter', () => {
      const obj = {
        ping (a) {}
      }
      assert.deepStrictEqual(utils.getParamNames(obj.ping), ['a'])
    })

    it('should handle function declaration with multiple parameter', () => {
      /* eslint prefer-arrow-callback: 0 */
      function declared (a, b, c) {
        noop()
      }
      assert.deepStrictEqual(utils.getParamNames(declared), ['a', 'b', 'c'])
    })

    it('should handle anonymous function with multiple parameters', () => {
      /* eslint prefer-arrow-callback: 0, no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function (a, b, c) {
        noop()
      }), ['a', 'b', 'c'])
    })

    it('should handle named function with multiple parameters', () => {
      /* eslint prefer-arrow-callback: 0, no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function named (a, b, c) {
        noop()
      }), ['a', 'b', 'c'])
    })

    it('should handle arrow function with multiple parameters', () => {
      /* eslint no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames((a, b, c) => {
        noop()
      }), ['a', 'b', 'c'])
    })

    it('should handle function shortcut with multiple parameters', () => {
      const obj = {
        ping (a, b, c) {}
      }
      assert.deepStrictEqual(utils.getParamNames(obj.ping), ['a', 'b', 'c'])
    })

    it('should handle function declaration with default values', () => {
      /* eslint prefer-arrow-callback: 0 */
      function declared (a, b, c = false) {
        noop()
      }
      assert.deepStrictEqual(utils.getParamNames(declared), ['a', 'b', 'c'])
    })

    it('should handle anonymous function with default values', () => {
      /* eslint prefer-arrow-callback: 0, no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function (a, b, c = 10) {
        noop()
      }), ['a', 'b', 'c'])
    })

    it('should handle named function with default values', () => {
      /* eslint prefer-arrow-callback: 0, no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames(function named (a, b, c = null) {
        noop()
      }), ['a', 'b', 'c'])
    })

    it('should handle arrow function with default values', () => {
      /* eslint no-unused-vars:0 */
      assert.deepStrictEqual(utils.getParamNames((a, b, c = []) => {
        noop()
      }), ['a', 'b', 'c'])
    })

    it('should handle function shortcut with default values', () => {
      const obj = {
        ping (a, b, c = 'yeah') {}
      }
      assert.deepStrictEqual(utils.getParamNames(obj.ping), ['a', 'b', 'c'])
    })

    it('should handle async function declaration', () => {
      async function declared (a, b, c) {
        noop()
      }
      assert.deepStrictEqual(utils.getParamNames(declared), ['a', 'b', 'c'])
    })

    it('should handle async anonymous function', () => {
      assert.deepStrictEqual(utils.getParamNames(async function (a, b, c) {
        noop()
      }), ['a', 'b', 'c'])
    })

    it('should handle async named function', () => {
      assert.deepStrictEqual(utils.getParamNames(async function named (a, b, c) {
        noop()
      }), ['a', 'b', 'c'])
    })

    it('should handle async arrow function', () => {
      assert.deepStrictEqual(utils.getParamNames(async (a, b, c) => {
        noop()
      }), ['a', 'b', 'c'])
    })

    it('should handle async function shortcut', () => {
      const obj = {
        async ping (a, b, c) {}
      }
      assert.deepStrictEqual(utils.getParamNames(obj.ping), ['a', 'b', 'c'])
    })
  })

  describe('extractGroups', () => {
    it('should get group from parameters', () => {
      const name = 'test'
      const init = noop
      assert.deepStrictEqual(utils.extractGroups({name, init}), {
        groups: [{name, init}],
        groupOpts: {[name]: {name, init}}
      })
    })

    it('should get groups from property', () => {
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
    })

    it('should get group options from property', () => {
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
    })

    it('should fail if no group found', () => {
      assert.throws(() => utils.extractGroups({name: 'test'}), /No APIs nor APIs groups defined/)
    })

    it('should fail on invalid group found', () => {
      assert.throws(() => utils.extractGroups({groups: ['not a group']}), /Group definition at position 0/)
    })
  })
})
