'use strict';

// Load modules

const MongoDB = require('mongodb');
const Hoek = require('hoek');
const Boom = require('boom');


// Declare internals

const internals = {};


internals.defaults = {
    uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5'
};


exports = module.exports = internals.Connection = class {

    constructor(options) {

        Hoek.assert(this instanceof internals.Connection, 'MongoDB cache client must be instantiated using new');

        this.db = null;
        this.collections = {};
        this.isConnected = false;
        this.connectionPromise = null;
        this.isConnectionStarted = false;
        this.settings = this.getSettings(options);

        return this;
    }

    getSettings(options) {
        /*
        Database names:

        - empty string is not valid
        - cannot contain space, "*<>:|?
        - limited to 64 bytes (after conversion to UTF-8)
        - admin, local and config are reserved
        */

        Hoek.assert(options.partition !== 'admin' && options.partition !== 'local' && options.partition !== 'config', 'Cache partition name cannot be "admin", "local", or "config" when using MongoDB');
        Hoek.assert(options.partition.length < 64, 'Cache partition must be less than 64 bytes when using MongoDB');

        // merge with defaults
        const settings = Hoek.applyToDefaults(internals.defaults, options);

        // replace or add database
        settings.uri = settings.uri.replace(/(mongodb:\/\/[^\/]*)([^\?]*)(.*)/,`$1/${settings.partition}$3`);

        return settings;
    }

    async start() {

        // Check if already connected
        if (this.isConnected) {
            return;
        }

        // Check if start already pending
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        // Connection started flag
        this.isConnectionStarted = true;

        try {
            // Open connection
            this.connectionPromise = MongoDB.MongoClient.connect(this.settings.uri);
            this.db = await this.connectionPromise;
            this.isConnected = true;
        }
        catch (err) {
            // reset connection promise so that a failed connect won't block a new start
            this.connectionPromise = null;
            throw err;
        }
    }

    stop() {

        if (this.db) {
            this.db.close();
            this.db = null;
            this.collections = {};
            this.isConnected = false;
            this.connectionPromise = null;
            this.isConnectionStarted = false;
        }
    }

    isReady() {

        return this.isConnected;
    }

    validateSegmentName(name) {

        /*
        Collection names:

        - empty string is not valid
        - cannot contain "\0"
        - avoid creating any collections with "system." prefix
        - user created collections should not contain "$" in the name
        - database name + collection name < 100 (actual 120)
        */

        if (!name) {
            throw new Boom('Empty string');
        }

        if (name.indexOf('\0') !== -1) {
            throw new Boom('Includes null character');
        }

        if (name.indexOf('system.') === 0) {
            throw new Boom('Begins with "system."');
        }

        if (name.indexOf('$') !== -1) {
            throw new Boom('Contains "$"');
        }

        if (name.length + this.settings.partition.length >= 100) {
            throw new Boom('Segment and partition name lengths exceeds 100 characters');
        }

        return null;
    }

    async getCollection(name) {

        if (!this.isConnected) {
            throw new Boom('Connection not ready');
        }

        if (!name) {
            throw new Boom('Collection name missing');
        }

        if (this.collections[name]) {
            return this.collections[name];
        }

        // Fetch collection
        const collection = await this.db.collection(name);

        // Found
        await collection.ensureIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        this.collections[name] = collection;

        return collection;
    }

    async get(key) {

        if (!this.isConnectionStarted) {
            throw new Boom('Connection not started');
        }

        const collection = await this.getCollection(key.segment);
        const criteria = { _id: key.id };
        const record = await collection.findOne(criteria);

        if (!record) {
            return null;
        }

        if (record.value === undefined || record.value === null || !record.stored) {
            throw new Boom('Incorrect record structure');
        }

        const envelope = {
            item: record.value,
            stored: record.stored.getTime(),
            ttl: record.ttl
        };

        return envelope;
    }

    async set(key, value, ttl) {

        if (!this.isConnectionStarted) {
            throw new Boom('Connection not started');
        }

        const collection = await this.getCollection(key.segment);
        const expiresAt = new Date();
        expiresAt.setMilliseconds(expiresAt.getMilliseconds() + ttl);

        const record = {
            _id: key.id,
            value,
            stored: new Date(),
            ttl,
            expiresAt
        };

        const criteria = { _id: key.id };

        await collection.update(criteria, record, { upsert: true, safe: true });
    }

    async drop(key) {

        if (!this.isConnectionStarted) {
            throw new Boom('Connection not started');
        }

        const collection = await this.getCollection(key.segment);

        const criteria = { _id: key.id };
        await collection.remove(criteria, { safe: true });
    }
};
