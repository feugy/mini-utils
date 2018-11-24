# Changelog

## 4.0.1
#### Changed
- Use latest standard formatting
- Remove NSP since it was decomissioned
- Use yarn instead of NPM
- Dependencies update

## 4.0.0
#### Added
- `loadTransport()` which validates incoming options and loads selected transport 
- `optionSchema` Joi schema used to validate incoming options

#### Changed
- Reformat CHANGELOG to follow [Keep a Changelog](https://keepachangelog.com) recommandations
- New documentation with latest docma v2.0.0
- Dependencies update

## 3.0.1
#### Fixed
- `getParamNames()` to support destructured parameters with default values

## 3.0.0
#### Fixed
- `getParamNames()` supports async functions with single parameter shortcut: `
   ```js
   getParamNames(async a => {}) === ['a']
   ```

#### Changed
- **Breaking**: `getParamNames()` supports rest parameters:
   ```js
   getParamNames((a, b, ...rest) => {}) === ['a', 'b', 'rest']
   ```
   It used to throw an Error
- **Breaking**: `getParamNames()` supports destructured parameters:
   ```js
   getParamNames((a, {b: [c]}, [d, e], f) => {}) === ['a', 'param1', 'param2', 'f']
   ```
   It used to throw an Error
- **Breaking**: Removed: `validateParams()` deprecated function


## 2.4.0
#### Changed
- **Deprecation**: `validateParams()` will be deprecated in next major version, in favour of: `enrichError()`
   Validation of input parameters and returned result is now responsability of mini-client & mini-service.
   `enrichError()` ensures that Joi `ValidationError`, when thrown, get enriched and turned into consistent
   Boom errors
- Dependencies update


## 2.3.0
### Added
- Expose CRC32 checksum header name

#### Changed
- Dependencies update


## 2.2.1
### Added
- `extractValidate()` function allowing validation objects in options
- Include API name in validation errors

#### Changed
- Better documentation


## 2.0.0
### Added
- Introduce `extractGroup()`

#### Changed
- **Breaking**: Rename service to group
- Use husky instead of ghooks
- Dependencies update


## 1.0.0
### Added
- initial release