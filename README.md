[![NPM Version][npm-image]][npm-url]
[![Dependencies][david-image]][david-url]
[![Build][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

# Minimalist µServices

The goal of [mini-service][mini-service-url] is to give the minimal structure to implement a µService, that can be invoked locally or remotely.
[Mini-client][mini-client-url] is a generic client that [limits coupling][distributed-monolith] between your project and a remote mini-service.

Its principles are the following:
- very easy to add new service api endpoints
- easy to use client interface, same usage both locally and remotely
- hide deployment details and provide simple-yet-working solution
- promises based

All mini-* libraries use the latest ES6 features, so they requires node 6+

Please checkout the [API reference][api-reference]


This project was kindly sponsored by [nearForm][nearform].

## License

Copyright [Damien Simonin Feugas][feugy] and other contributors, licensed under [MIT](./LICENSE).

## Changelog

### 2.3.0
- Expose CRC32 checksum header name
- Dependencies update

### 2.2.1
- Add extractValidate that allow validation objects in options
- Include API name in validation errors
- Better documentation

### 2.0.0
- Rename service to group
- Introduce extractGroup()
- Upgrade all deps to latests
- Use husky instead of ghooks

### 1.0.0
- initial release

[nearform]: http://nearform.com
[feugy]: https://github.com/feugy
[mini-service-url]: https://github.com/feugy/mini-service
[mini-client-url]: https://github.com/feugy/mini-client
[david-image]: https://img.shields.io/david/feugy/mini-utils.svg
[david-url]: https://david-dm.org/feugy/mini-utils
[npm-image]: https://img.shields.io/npm/v/mini-service-utils.svg
[npm-url]: https://npmjs.org/package/mini-service-utils
[travis-image]: https://api.travis-ci.org/feugy/mini-utils.svg
[travis-url]: https://travis-ci.org/feugy/mini-utils
[coveralls-image]: https://img.shields.io/coveralls/feugy/mini-utils/master.svg
[coveralls-url]: https://coveralls.io/r/feugy/mini-utils?branch=master
[distributed-monolith]: https://www.infoq.com/news/2016/02/services-distributed-monolith
[api-reference]: https://feugy.github.io/mini-utils/
