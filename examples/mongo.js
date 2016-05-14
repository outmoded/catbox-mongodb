'use strict';

// After starting this example load http://localhost:8080 and hit refresh, you will notice that it loads the response from cache for the first 5 seconds and then reloads the cache

// Load modules

const Catbox = require('catbox');
const Http = require('http');



// Declare internals

const internals = {};


internals.handler = function (req, res) {

    internals.getResponse((err, item) => {

        if (err) {
            res.writeHead(500);
            res.end();
        }
        else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(item);
        }
    });
};


internals.getResponse = function (callback) {

    const key = {
        segment: 'example',
        id: 'myExample'
    };

    internals.client.get(key, (err, cached) => {

        if (err) {
            return callback(err);
        }
        else if (cached) {
            return callback(null, 'From cache: ' + cached.item);
        }
        internals.client.set(key, 'my example', 5000, (error) => {

            callback(error, 'my example');
        });
    });
};


internals.startCache = function (callback) {

    const options = {
        partition: 'examples'
    };

    internals.client = new Catbox.Client(require('../'), options);      // Replace require('../') with 'catbox-mongodb' in your own code
    internals.client.start(callback);
};


internals.startServer = function () {

    const server = Http.createServer(internals.handler);
    server.listen(8080);
    console.log('Server started at http://localhost:8080/');
};


internals.startCache(internals.startServer);
