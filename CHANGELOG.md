# Changelog

## 2.4.0
- *[Deprecation]* `validateParams()` will be deprecated in next major version, in favour of: `enrichError()`
   Validation of input parameters and returned result is now responsability of mini-client & mini-service.
   `enrichError()` ensures that Joi `ValidationError`, when thrown, get enriched and turned into consistent
   Boom errors
- Dependencies update

## 2.3.0
- Expose CRC32 checksum header name
- Dependencies update

## 2.2.1
- Add extractValidate that allow validation objects in options
- Include API name in validation errors
- Better documentation

## 2.0.0
- Rename service to group
- Introduce extractGroup()
- Upgrade all deps to latests
- Use husky instead of ghooks

## 1.0.0
- initial release