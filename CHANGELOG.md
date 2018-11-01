# Changelog

## [4.2.1](https://github.com/hapijs/catbox-mongodb/compare/v4.2.0...v4.2.1) - 2018-11-01

### Changed
- destructure `key` parameter for get, set, drop into `{ id, segment }`
- fix deprecation warnings by updating to the latest implementation of MongoDB driver methods
- Run tests on Node.js v11 (travis)
- bump dependencies
- clean up `.gitignore`


## [4.2.0](https://github.com/hapijs/catbox-mongodb/compare/v4.1.0...v4.2.0) - 2018-03-12

### Added
- Example usage in a simple hapi project


### Changed
- Update `mongodb` dependency to 3.x
- Fix flaky test (increase timeout)
- Rename `mongo` example to `catbox`
- Update Readme


## [4.1.0](https://github.com/hapijs/catbox-mongodb/compare/v4.0.0...v4.1.0) - 2018-02-04

### Added
- Pass through falsy values from cache to client


### Changed
- Add test for falsy values
- Updated Readme
- Update example to `async/await`


## [4.0.0](https://github.com/hapijs/catbox-mongodb/compare/v3.0.1...v4.0.0) - 2017-11-28

### Changed
- Update `catbox-mongodb` to fully `async/await`
- Bump dependencies
- Bump supported Node.js versions to 8 or higher

