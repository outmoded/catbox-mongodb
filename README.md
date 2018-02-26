catbox-mongodb
==============

MongoDB adapter for [catbox](https://github.com/hapijs/catbox)

[![Build Status](https://travis-ci.org/hapijs/catbox-mongodb.svg)](https://travis-ci.org/hapijs/catbox-mongodb)
[![catbox-mongodb](https://img.shields.io/npm/v/catbox-mongodb.svg)](https://www.npmjs.com/package/catbox-mongodb)

Lead Maintainer: [Marcus Poehls](https://github.com/marcuspoehls)

**catbox-mongodb** serializes values to BSON using MongoDB driver, therefore following data types are supported for this adapter: Object, Array, Number, String, Date, RegExp.


## Installation
> The lastest `catbox-mongodb` version `4.x` works only with **hapi v17**

Install `catbox-mongodb` via NPM. Remember that `catbox-mongodb` requires its parent module [`catbox`](https://github.com/hapijs/catbox):

```
npm install catbox catbox-mongodb
```

---

Do you use **hapi v16 or lower**? Install `catbox-mongodb` version `3.x` with a compatible version of `catbox`:

```
# for hapi v16 (or lower)
npm install catbox@9 catbox-mongodb@3
```


## Options
`catbox-mongodb` accepts the following options:

- `uri` - the [MongoDB URI](https://docs.mongodb.com/manual/reference/connection-string/), defaults to `'mongodb://127.0.0.1:27017/?maxPoolSize=5'`
- `partition` - the MongoDB database for cached items


## Usage
Sample catbox cache initialization :

```JS
const Catbox = require('catbox');

const cache = new Catbox.Client(require('catbox-mongodb'), {
    uri: 'your-mongodb-uri', // Defaults to 'mongodb://127.0.0.1:27017/?maxPoolSize=5' if not provided
    partition: 'cache'
})
```

Or configure your hapi server to use `catbox-mongodb` as the caching strategy (code snippet uses hapi `v17`):

```js
const Hapi = require('hapi')
const CatboxMongoDB = require('catbox-mongodb')

const server = new Hapi.Server({
    cache : [{
        name      : 'mongoDbCache',
        engine    : CatboxMongoDB,
        uri       : 'your-mongodb-uri', // Defaults to 'mongodb://127.0.0.1:27017/?maxPoolSize=5' if not provided
        partition : 'cache'
    }]
});
```
