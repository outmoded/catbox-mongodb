'use strict';

// After starting this example load http://localhost:8080
// hit refresh, you will notice that it loads the response
// from cache for the first 5 seconds and then reloads the cache


// Load modules
const CatboxMongo = require('..');
const Hapi = require('hapi');


// create server instance with MongoDB cache
const server = new Hapi.Server({
    port: 8080,
    cache: [
        {
            name: 'mongoCache',
            engine: CatboxMongo,
            host: '127.0.0.1',
            partition: 'example-cache'
        }
    ]
});


// define a cache segment to store cache items
const Cache = server.cache({ segment: 'examples', expiresIn: 1000 * 5 });


// wildcard route that responds all requests
// either with data from cache or default string
server.route({
    method: 'GET',
    path: '/{path*}',
    handler: async (request, h) => {

        const key = {
            segment: 'examples',
            id: 'myExample'
        };

        // get item from cache segment
        const cached = await Cache.get(key);

        if (cached) {
            return `From cache: ${cached.item}`;
        }

        // fill cache with item
        await Cache.set(key, { item: 'my example' }, 5000);

        return 'my example';
    }
});


const start = async function () {

    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();
