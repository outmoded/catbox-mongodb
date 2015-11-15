catbox-mongodb
==============

MongoDB adapter for catbox

[![Build Status](https://secure.travis-ci.org/hapijs/catbox-mongodb.png)](http://travis-ci.org/hapijs/catbox-mongodb)

Lead Maintainer: [Jarda Kotesovec](https://github.com/jardakotesovec)

**catbox-mongodb** serializes values to BSON using MongoDB driver, therefore following data types are supported for this adapter: Object, Array, Number, String, Date, RegExp.


### Options

- `uri` - the [MongoDB URI](https://docs.mongodb.org/v3.0/reference/connection-string/). Defaults to `'mongodb://127.0.0.1:27017/?maxPoolSize=5'`.
- `partition` - the MongoDB server database.