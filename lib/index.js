const bunyan = require('bunyan')
const joi = require('joi')
const {boomify} = require('boom')
const acorn = require('acorn/dist/acorn_loose')
const {name} = require('../package.json')

/**
 * Utilities for mini-server and mini-client
 * @module
 */

// already created logger
let logger = null

/**
 * @summary Creates or re-use an existing logger
 * @param {Object} [opts = {}]  optional buyan options
 * @returns {Logger}            logger object.
 */
exports.getLogger = (opts = {}) => {
  if (!logger) {
    logger = bunyan.createLogger(Object.assign({
      name,
      streams: [{
        level: 'debug',
        stream: process.stdout
      }]
    }, opts))
  }
  return logger
}

/**
 * Utility function to get parameter name from AST node.
 * Supports:
 * - plain identifier
 * - default values (assignment pattern & expression)
 * - rest parameters (rest & spread element)
 * - destructured parameters (object pattern & expression, array pattern & expression)
 *   who got a generated name
 *
 * @param {Object} node   AST node, likely to represent a function parameter
 * @param {Number} index  current parameter index in function signature
 * @returns {String} parameter name (generated for destructured arguments)
 */
const extractParamName = (node, index) => {
  switch (node.type) {
    case 'Identifier':
      // regular parameter
      return node.name
    case 'AssignmentPattern':
    case 'AssignmentExpression': // eslint-disable-line no-fallthrough
      // parameter with default values
      return node.left.name
    case 'RestElement':
    case 'SpreadElement': // eslint-disable-line no-fallthrough
      // rest parameter
      return node.argument.name
    case 'ObjectPattern':
    case 'ObjectExpression': // eslint-disable-line no-fallthrough
    case 'ArrayPattern': // eslint-disable-line no-fallthrough
    case 'ArrayExpression': // eslint-disable-line no-fallthrough
      // rest parameter
      return `param${index + 1}`
  }
}

/**
 * Extract declared parameter names from function signature
 *
 * Lots of different signature are supported:
 * - `function` keyword, with or without function name
 * - "fat arrow" syntax, with or without parenthesis
 * - parameter with default values
 * - async functions
 *
 * Rest parameters are supported.
 * Destructured parameters are returned with a generated name
 *
 * @param {Function} fn     analyzed function
 * @returns {Array<String>} array of declared parameters (might be empty)
 * @throws {Error} if the passed argument isn't a function, or uses unsupported syntax
 */
exports.getParamNames = fn => {
  const declaration = `(${(fn || '').toString()})`
  try {
    // parse doesn't work with function shortcut in objects, like:
    // getParamNames(({test() {}}).test)
    const {body: [node]} = acorn.parse_dammit(declaration, {
      ecmaVersion: 9
    })
    if (node.type !== 'ExpressionStatement') {
      throw new Error(`unexpected node type ${node.type}`)
    }
    const {type, params, arguments: args} = node.expression
    switch (type) {
      case 'ArrowFunctionExpression':
        // a => {
        // (a, b, c) => {
        // async (a, b, c) => {
      case 'FunctionExpression': // eslint-disable-line no-fallthrough
        // async function named(a, b, c)
        return params.map(extractParamName)
      case 'CallExpression':
        // named (a, b, c) {
        // function (a, b, c) {
        // function named(a, b, c) {
        return args.map(extractParamName)
      default:
        throw new Error(`unexpected expression ${type}`)
    }
  } catch (err) {
    throw new Error(`unsupported function ${fn}`)
  }
}

/**
 * Transform an array to an object, assigning each array item to a given property.
 *
 * Provided values that doesn't have any expected properties will be kept in the
 * resulting object, affected to a property named after the index.
 * Of course, order in both parameters is significant.
 *
 * @param {Array<Any>} array          array mapped to an object
 * @param {Array<String>} properties  property names used to create the object
 * @returns {Object}                  obj that contain properties specified in `properties`,
 * with corresponding values from `array`
 */
exports.arrayToObj = (array, properties) => {
  const obj = {}
  // affect first expected properties
  for (const [i, prop] of properties.entries()) {
    obj[prop] = array[i]
  }
  // includes also unexpected values
  for (let i = properties.length; i < array.length; i++) {
    obj[i] = array[i]
  }
  return obj
}

/**
 * Enrich validation error for a given API, with friendly message
 *
 * When enriching validation error for:
 * - input parameters, a 400 (Bad Request) Boom error is returned
 * - returned results, a 512 (Bad Response) Boom error is returned
 *
 * @param {ValidationError} err       Joi validation error, or null
 * @param {String} id                 API id used in error detailed report
 * @param {Boomean} [forInput = true] true when enriching error for input parameters,
 *                                    false for returned result
 * @returns {Error|null}              the enriched detailed error, or null err was so
 */
exports.enrichError = (err, id, forInput = true) => {
  if (!err) {
    return null
  }
  // customize error message for convenience
  err.message = `Incorrect ${forInput ? 'parameters' : 'response'} for API ${id}: ${err.message}`
  const error = boomify(err, {statusCode: forInput ? 400 : 512})
  if (!forInput) {
    error.output.payload.error = 'Bad Response'
  }

  return error
}

/**
 * Check if the exposed apis is acceptable for further processing
 *
 * @param {Any} apis    checked apis
 * @returns {Boolean}   true if object can be exposed
 */
exports.isApi = apis => !!apis && typeof apis === 'object' && !Array.isArray(apis)

// expected schema for exposed API groups
exports.groupSchema = joi.object({
  name: joi.string().required(),
  init: joi.func().required()
}).unknown(true)

/**
 * @typedef {Object} ExtractionResult
 * @property {Array<Object>} groups   array of API groups
 * @property {Object} groupOpts       hash of group parameter, group names are used as properties
 */

/**
 * Extract API groups and API options from parameter
 *
 * API groups are objects compliant with mini-service-utils.groupSchema.
 * They could be specified in the `groups` property (options will be in `groupOpts`).
 * The specify parameter could be the group itself, mixed with the options.
 *
 * @param {Object} opts         analyzed parameter
 * @return {ExtractionResult}   extracted groups
 */
exports.extractGroups = opts => {
  const result = {groups: [], groupOpts: {}}
  if (!exports.groupSchema.validate(opts).error) {
    // APIs are contained in the opts themselves
    result.groups.push(opts)
    result.groupOpts[opts.name] = opts
  } else if (Array.isArray(opts.groups)) {
    // APIs are grouped
    const valid = joi.array().items(exports.groupSchema).validate(opts.groups)
    if (valid.error) throw new Error(`Group definition ${valid.error.message.replace(/^"value" /, '')}`)
    result.groups = opts.groups
    result.groupOpts = opts.groupOpts || {}
  } else {
    throw new Error('No APIs nor APIs groups defined')
  }
  return result
}

/**
 * Extract validation objects for a given API
 *
 * Each exposed API can have a Joi object assigned to validate received parameters/response
 * This validation object can be either:
 * - in the clause property of the API function
 * - in the clause property of the API group options
 *
 * @param {String} id       name of the exposed API for which validation object is researched
 * @param {Object} apis     hash containing the exposed API function
 * @param {Object} opts     options that may contains validation hash
 * @param {Object} [opts.validate]  May contains validation object for the exposed API
 * @param {String} [clause = 'validate']  name of the searched clause, defaults to 'validate'
 * @return {Joi|null}       validation object found, or null
 */
exports.extractValidate = (id, apis, opts, clause = 'validate') =>
  apis[id][clause] || (opts && opts[clause]) || null

/**
 * HTTP header name used in response to exchange exposed API checksum.
 * Will contain the CRC-32 checksum of the `JSON.stringify(exposed.apis)` array
 */
exports.checksumHeader = 'x-service-crc'
