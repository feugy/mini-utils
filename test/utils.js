const Lab = require('lab')
const Joi = require('joi')
const { badRequest } = require('boom')
const assert = require('power-assert')
const rewire = require('rewire')
const utils = rewire('../')

const lab = exports.lab = Lab.script()
const { describe, it, beforeEach } = lab

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
      assert.deepStrictEqual(utils.extractValidate(id, apis, { validate: validation }), validation)
    })

    it('should extract another clause from opts', () => {
      const id = 'test6'
      const apis = {
        [id]: () => {}
      }
      const validation = Joi.array()
      assert.deepStrictEqual(
        utils.extractValidate(id, apis, { responseSchema: validation }, 'responseSchema'),
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
      const logger = utils.getLogger({ name: 'toto' })
      assert(logger)
      assert(logger.debug)
      assert.equal(logger.fields.name, 'toto')
    })
  })

  describe('arrayToObj', () => {
    it('should transform an array to an object', () => {
      assert.deepStrictEqual(utils.arrayToObj([1, 2], ['count', 'other']), { count: 1, other: 2 })
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
      assert(utils.isApi({ method: () => {}, attribute: 1 }))
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

  describe('enrichError', () => {
    const validationError = Joi.object({ other: Joi.string().required() }).validate({ count: 1 }).error

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

    const suites = [{
      name: 'without parameter',
      expected: [],
      tests: [{
        name: 'function declaration',
        code: () => {
          function declared () {}
          return declared
        }
      }, {
        name: 'async function declaration',
        code: () => {
          async function declared () {}
          return declared
        }
      }, {
        name: 'anonymous function',
        code: () => function () {}
      }, {
        name: 'async anonymous function',
        code: () => async function () {}
      }, {
        name: 'named function',
        code: () => function named () {}
      }, {
        name: 'async named function',
        code: () => async function named () {}
      }, {
        name: 'function shortcut',
        code: () => {
          const obj = {
            named () {}
          }
          return obj.named
        }
      }, {
        name: 'async function shortcut',
        code: () => {
          const obj = {
            async named () {}
          }
          return obj.named
        }
      }, {
        name: 'arrow function',
        code: () => () => {}
      }, {
        name: 'async arrow function',
        code: () => async () => {}
      }]
    }, {
      name: 'with single parameter',
      expected: ['a'],
      tests: [{
        name: 'function declaration',
        code: () => {
          function declared (a) {}
          return declared
        }
      }, {
        name: 'async function declaration',
        code: () => {
          async function declared (a) {}
          return declared
        }
      }, {
        name: 'anonymous function',
        code: () => function (a) {}
      }, {
        name: 'async anonymous function',
        code: () => async function (a) {}
      }, {
        name: 'named function',
        code: () => function named (a) {}
      }, {
        name: 'async named function',
        code: () => async function named (a) {}
      }, {
        name: 'function shortcut',
        code: () => {
          const obj = {
            named (a) {}
          }
          return obj.named
        }
      }, {
        name: 'async function shortcut',
        code: () => {
          const obj = {
            async named (a) {}
          }
          return obj.named
        }
      }, {
        name: 'arrow function',
        code: () => a => {}
      }, {
        name: 'async arrow function',
        code: () => async a => {}
      }]
    }, {
      name: 'with multiple parameters',
      expected: ['a', 'b', 'c'],
      tests: [{
        name: 'function declaration',
        code: () => {
          function declared (a, b, c) {}
          return declared
        }
      }, {
        name: 'async function declaration',
        code: () => {
          async function declared (a, b, c) {}
          return declared
        }
      }, {
        name: 'anonymous function',
        code: () => function (a, b, c) {}
      }, {
        name: 'async anonymous function',
        code: () => async function (a, b, c) {}
      }, {
        name: 'named function',
        code: () => function named (a, b, c) {}
      }, {
        name: 'async named function',
        code: () => async function named (a, b, c) {}
      }, {
        name: 'function shortcut',
        code: () => {
          const obj = {
            named (a, b, c) {}
          }
          return obj.named
        }
      }, {
        name: 'async function shortcut',
        code: () => {
          const obj = {
            async named (a, b, c) {}
          }
          return obj.named
        }
      }, {
        name: 'arrow function',
        code: () => (a, b, c) => {}
      }, {
        name: 'async arrow function',
        code: () => async (a, b, c) => {}
      }]
    }, {
      name: 'with default values',
      expected: ['a', 'b', 'c'],
      tests: [{
        name: 'function declaration',
        code: () => {
          function declared (a, b, c = null) {}
          return declared
        }
      }, {
        name: 'async function declaration',
        code: () => {
          async function declared (a, b, c = 10) {}
          return declared
        }
      }, {
        name: 'anonymous function',
        code: () => function (a, b, c = '') {}
      }, {
        name: 'async anonymous function',
        code: () => async function (a, b, c = []) {}
      }, {
        name: 'named function',
        code: () => function named (a, b, c = true) {}
      }, {
        name: 'async named function',
        code: () => async function named (a, b, c = false) {}
      }, {
        name: 'function shortcut',
        code: () => {
          const obj = {
            named (a, b, c = {}) {}
          }
          return obj.named
        }
      }, {
        name: 'async function shortcut',
        code: () => {
          const obj = {
            async named (a, b, c = () => {}) {}
          }
          return obj.named
        }
      }, {
        name: 'arrow function',
        code: () => (a, b, c = describe) => {}
      }, {
        name: 'async arrow function',
        code: () => async (a, b, c = null) => {}
      }]
    }, {
      name: 'with rest parameters',
      expected: ['a', 'b', 'rest'],
      tests: [{
        name: 'function declaration',
        code: () => {
          function declared (a, b, ...rest) {}
          return declared
        }
      }, {
        name: 'async function declaration',
        code: () => {
          async function declared (a, b, ...rest) {}
          return declared
        }
      }, {
        name: 'anonymous function',
        code: () => function (a, b, ...rest) {}
      }, {
        name: 'async anonymous function',
        code: () => async function (a, b, ...rest) {}
      }, {
        name: 'named function',
        code: () => function named (a, b, ...rest) {}
      }, {
        name: 'async named function',
        code: () => async function named (a, b, ...rest) {}
      }, {
        name: 'function shortcut',
        code: () => {
          const obj = {
            named (a, b, ...rest) {}
          }
          return obj.named
        }
      }, {
        name: 'async function shortcut',
        code: () => {
          const obj = {
            async named (a, b, ...rest) {}
          }
          return obj.named
        }
      }, {
        name: 'arrow function',
        code: () => (a, b, ...rest) => {}
      }, {
        name: 'async arrow function',
        code: () => async (a, b, ...rest) => {}
      }]
    }, {
      name: 'with destructured parameters',
      expected: ['a', 'param2', 'c'],
      tests: [{
        name: 'function declaration',
        code: () => {
          function declared (a, { b: [d] }, c) {}
          return declared
        }
      }, {
        name: 'async function declaration',
        code: () => {
          async function declared (a, { b: { d } }, c) {}
          return declared
        }
      }, {
        name: 'anonymous function',
        code: () => function (a, { b, d }, c) {}
      }, {
        name: 'async anonymous function',
        code: () => async function (a, [b], c) {}
      }, {
        name: 'named function',
        code: () => function named (a, { b }, c) {}
      }, {
        name: 'async named function',
        code: () => async function named (a, { b }, c) {}
      }, {
        name: 'function shortcut',
        code: () => {
          const obj = {
            named (a, [b, ...rest], c) {}
          }
          return obj.named
        }
      }, {
        name: 'async function shortcut',
        code: () => {
          const obj = {
            async named (a, { b } = {}, c) {}
          }
          return obj.named
        }
      }, {
        name: 'arrow function',
        code: () => (a, [b] = [], c) => {}
      }, {
        name: 'async arrow function',
        code: () => async (a, { b }, c) => {}
      }]
    }]

    suites.forEach(({ name, expected, tests }) => {
      describe(name, () => {
        tests.forEach(({ name, code }) => {
          it(`should handle ${name}`, () => {
            assert.deepStrictEqual(utils.getParamNames(code()), expected)
          })
        })
      })
    })
  })

  describe('extractGroups', () => {
    it('should get group from parameters', () => {
      const name = 'test'
      const init = noop
      assert.deepStrictEqual(utils.extractGroups({ name, init }), {
        groups: [{ name, init }],
        groupOpts: { [name]: { name, init } }
      })
    })

    it('should get groups from property', () => {
      const name1 = 'test1'
      const init1 = noop
      const name2 = 'test2'
      const init2 = noop
      assert.deepStrictEqual(utils.extractGroups({
        groups: [{ name: name1, init: init1 }, { name: name2, init: init2 }]
      }), {
        groups: [{ name: name1, init: init1 }, { name: name2, init: init2 }],
        groupOpts: {}
      })
    })

    it('should get group options from property', () => {
      const name1 = 'test1'
      const init1 = noop
      const name2 = 'test2'
      const init2 = noop
      assert.deepStrictEqual(utils.extractGroups({
        groups: [{ name: name1, init: init1 }, { name: name1, init: init1 }],
        groupOpts: { [name1]: { name: name1 }, [name2]: { name: name2 } }
      }), {
        groups: [{ name: name1, init: init1 }, { name: name1, init: init2 }],
        groupOpts: { [name1]: { name: name1 }, [name2]: { name: name2 } }
      })
    })

    it('should fail if no group found', () => {
      assert.throws(() => utils.extractGroups({ name: 'test' }), /No APIs nor APIs groups defined/)
    })

    it('should fail on invalid group found', () => {
      assert.throws(() => utils.extractGroups({ groups: ['not a group'] }), /Group definition at position 0/)
    })
  })

  describe('loadTransport', () => {
    const logger = {
      debug: () => {},
      info: () => {}
    }

    it('should assert incoming options', () => {
      assert.throws(() => {
        utils.loadTransport({ transport: { type: 'Whatever' } }, require)
      }, /"logger" is required/)
    })

    it('should report unknown transport', () => {
      assert.throws(() => {
        utils.loadTransport({ transport: { type: 'unknown' }, logger }, require)
      }, /Cannot load transport unknown/)
    })

    it('should report existing transport', () => {
      assert.strictEqual(utils.loadTransport({ transport: { type: 'test' }, logger }, require), 'yeah')
    })
  })
})
