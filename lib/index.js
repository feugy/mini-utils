const bunyan = require('bunyan')
const joi = require('joi')
const {name} = require('../package.json')

// already created logger
let logger = null

/**
 * Creates or re-use an existing logger
 * @param {Object} [opts = {}] - optional buyan options
 * @returns {Logger} logger - logger object.
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
 * Extract declared parameter names from funciton signature
 * Rest parameters are not supported
 *
 * @param {Function} fn - analyzed function
 * @returns {Array<String>} names - array of declared parameters (might be empty)
 * @throws {Error} if the passed argument isn't a function, or is unsupported
 */
exports.getParamNames = fn => {
  const declaration = (fn || '').toString()
  if (/^\s*[^(]+?\s*=>/.test(declaration)) {
    // covers the following cases: "name =>",
    return [declaration.match(/^\s*(\S+)\s*=>/)[1]]
  }
  if (/^[^(]*?\(/.test(declaration)) {
    // covers the following cases: "function ()", "() =>", "name () {", "function name () {" {},
    const params = declaration.match(/^[^(]*\(((?:.+?, )*?.*?)\)/)[1].split(', ')
      // remove empty false-positives
      .filter(p => p)
      // remove default values
      .map(p => p.replace(/\s*=.+/, ''))
    // guard against rest parameters
    for (const p of params) {
      if (p.startsWith('...')) {
        throw new Error(`unsupported function ${fn}: rest parameter ${p}`)
      }
    }
    return params
  }
  throw new Error(`unsupported function ${fn}`)
}

/**
 * Transform an array to an object, assigning each array item to a given property.
 * Of course, order in both parameter is significant.
 * Provided values that doesn't have any expected properties will be kept in the
 * resulting object, affected to a property named after the index
 * @param {Array<Any>} array - array mapped to an object
 * @param {Array<String>} properties - property names used to create the object
 * @returns {Object} obj - obj that contain properties specified in `properties`,
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
 * Validates some values with the given schema, with a custom error message when
 * more values than expected are provided
 * @param {Object} values - validated values, provided into a hash
 * @param {Joi} schema - Joi validation schema
 * @param {String} id - API id used in error detailed report
 * @param {Number} expected - expected number of values
 * @returns {Error} error - if validation failed, the detailed error, or null if values are valid
 */
exports.validateParams = (values, schema, id, expected) => {
  if (Object.keys(values).length > expected) {
    // too many values provided
    return new Error(`API ${id} must contain at most ${expected} parameters`)
  }
  return schema.validate(values).error
}

/**
 * Check if the exposed apis is acceptable for further processing
 * @param {Any} apis - checked apis
 * @returns {Boolean} isApi - true if object can be exposed
 */
exports.isApi = apis => !!apis && typeof apis === 'object' && !Array.isArray(apis)

// expected schema for exposed API groups
exports.groupSchema = joi.object({
  name: joi.string().required(),
  init: joi.func().required()
}).unknown(true)

/**
 * Extract API groups and API options from parameter
 * API groups are objects compliant with mini-service-utils.groupSchema.
 * They could be specified in the 'groups' property (options will be in 'groupOpts').
 * The specify parameter could be the group itself, mixed with the options
 * @param {Object} opts - analyzed parameter
 * @return {Object} result - extracted groups:
 * @return {Array<Group>} result.groups - array of API groups
 * @return {Object} result.groupOpts - hash of group parameter, group names are used as properties
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
