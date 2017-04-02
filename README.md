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


This project was kindly sponsored by [nearForm][nearform].

## License

Copyright [Damien Simonin Feugas][feugy] and other contributors, licensed under [MIT](./LICENSE).

## Changelog

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
