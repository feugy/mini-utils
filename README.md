# Minimalist µServices

[![NPM Version][npm-badge]][npm-url]
[![Dependencies][david-badge]][david-url]
[![Build][travis-badge]][travis-url]
[![Test Coverage][coveralls-badge]][coveralls-url]
[![License: MIT][license-badge]][license-url]

The goal of [mini-service][mini-service-url] is to give the minimal structure to implement a µService, that can be invoked locally or remotely.
[Mini-client][mini-client-url] is a generic client that [limits coupling][distributed-monolith] between your project and a remote mini-service.

Its principles are the following:
- very easy to add new service api endpoints
- easy to use client interface, same usage both locally and remotely
- hide deployment details and provide simple-yet-working solution
- promises based

All mini-* libraries use the latest ES2017 features, so they requires node 8+

Please checkout the [API reference][api-reference]


This project was kindly sponsored by [nearForm][nearform].

## License

Copyright [Damien Simonin Feugas][feugy] and other contributors, licensed under [MIT](./LICENSE).

[nearform]: http://nearform.com
[feugy]: https://github.com/feugy
[mini-service-url]: https://github.com/feugy/mini-service
[mini-client-url]: https://github.com/feugy/mini-client
[david-badge]: https://img.shields.io/david/feugy/mini-utils.svg
[david-url]: https://david-dm.org/feugy/mini-utils
[npm-badge]: https://img.shields.io/npm/v/mini-service-utils.svg
[npm-url]: https://npmjs.org/package/mini-service-utils
[travis-badge]: https://api.travis-ci.org/feugy/mini-utils.svg
[travis-url]: https://travis-ci.org/feugy/mini-utils
[coveralls-badge]: https://img.shields.io/coveralls/feugy/mini-utils/master.svg
[coveralls-url]: https://coveralls.io/r/feugy/mini-utils?branch=master
[nsp-badge]: https://nodesecurity.io/orgs/perso/projects/6bc9b474-6f9e-4db0-a4d3-c3bf5443a63a/badge
[nsp-url]: https://nodesecurity.io/orgs/perso/projects/6bc9b474-6f9e-4db0-a4d3-c3bf5443a63a
[distributed-monolith]: https://www.infoq.com/news/2016/02/services-distributed-monolith
[api-reference]: https://feugy.github.io/mini-utils/
[license-badge]: https://img.shields.io/badge/License-MIT-green.svg
[license-url]: https://github.com/feugy/mini-utils/blob/master/LICENSE
