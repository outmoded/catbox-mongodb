'use strict';

// After starting this example load http://localhost:8080
// hit refresh, you will notice that it loads the response
// from cache for the first 5 seconds and then reloads the cache


// Load modules
const Catbox = require('catbox');
const Http = require('http');


// Declare internals
const internals = {};


internals.handler = async (req, res) => {

    try {
        const item = await internals.getResponse();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(item);
    }
    catch (ignoreErr) {
        res.writeHead(500);
        res.end();
    }
};


internals.getResponse = async () => {

    const key = {
        segment: 'example',
        id: 'myExample'
    };

    const cached = await internals.client.get(key);

    if (cached) {
        return `From cache: ${cached.item}`;
    }

    await internals.client.set(key, 'my example', 5000);
    return 'my example';
};


internals.startCache = async () => {

    const options = {
        partition: 'examples'
    };

    internals.client = new Catbox.Client(require('../'), options);    // Replace require('../') with 'catbox-mongodb' in your own code
    await internals.client.start();
};


internals.startServer = () => {

    const server = Http.createServer(internals.handler);
    server.listen(8080);
    console.log('Server started at http://localhost:8080/');
};

internals.start = async () => {

    await internals.startCache();
    internals.startServer();
};

internals.start();
