catbox-mongodb
==============

MongoDB adapter for [catbox](https://github.com/hapijs/catbox)

[![Build Status](https://travis-ci.org/hapijs/catbox-mongodb.svg)](https://travis-ci.org/hapijs/catbox-mongodb)

Lead Maintainer: [Marcus Poehls](https://github.com/marcuspoehls)

**catbox-mongodb** serializes values to BSON using MongoDB driver, therefore following data types are supported for this adapter: Object, Array, Number, String, Date, RegExp.


## Installation
Install `catbox-mongodb` via NPM. Remember that `catbox-mongodb` requires its parent module [`catbox`](https://github.com/hapijs/catbox):

```
npm install catbox catbox-mongodb
```

## Options
Pass the following options to `catbox-mongodb` and customize the default behavior:

- `uri` - the [MongoDB URI](https://docs.mongodb.org/v3.0/reference/connection-string/). Defaults to `'mongodb://127.0.0.1:27017/?maxPoolSize=5'`.
- `partition` - the MongoDB server database.


## Sample Usage
A sample catbox cache initialization:

```JS
const Catbox = require('catbox');

const cache = new Catbo x.Client(require('catbox-mongodb'), {
    uri: 'your-mongodb-uri', // Defaults to 'mongodb://127.0.0.1:27017/?maxPoolSize=5' if not provided
    partition: 'cache'
})
```

Or configure your hapi server to use `catbox-mongodb` as the caching strategy:

```js
const Hapi = require('hapi')
const CatboxMongoDB = require('catbox-mongodb')

const server = new Hapi.Server({
    cache : [{
        name      : 'mongoDbCache',
        engine    : CatboxMongoDB,
        uri       : 'your-mongodb-uri' // Defaults to 'mongodb://127.0.0.1:27017/?maxPoolSize=5' if not provided
        partition : 'cache'
    }]
});
```