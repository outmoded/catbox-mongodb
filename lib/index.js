'use strict';

const MongoDB = require('mongodb');
const Hoek = require('hoek');
const Boom = require('boom');

const defaults = {
    uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5'
};

exports = module.exports = class Connection {

    constructor(options) {

        Hoek.assert(this instanceof Connection, 'MongoDB cache client must be instantiated using new');

        this.db = null;
        this.client = null;
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

        const settings = Hoek.applyToDefaults(defaults, options);

        settings.uri = settings.uri.replace(/(mongodb:\/\/[^\/]*)([^\?]*)(.*)/,`$1/${settings.partition}$3`);

        return settings;
    }

    async start() {

        if (this.isConnected) {
            return;
        }

        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.isConnectionStarted = true;

        try {
            this.connectionPromise = MongoDB.MongoClient.connect(this.settings.uri, {
                useNewUrlParser: true
            });
            this.client = await this.connectionPromise;
            this.db = this.client.db();
            this.isConnected = true;
        }
        catch (err) {
            this.connectionPromise = null;
            throw err;
        }
    }

    stop() {

        if (this.client) {
            this.client.close();

            this.db = null;
            this.client = null;
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

        const collection = await this.db.collection(name);

        await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        this.collections[name] = collection;

        return collection;
    }

    async get({ id, segment }) {

        if (!this.isConnectionStarted) {
            throw new Boom('Connection not started');
        }

        const collection = await this.getCollection(segment);
        const criteria = { _id: id };
        const record = await collection.findOne(criteria);

        if (!record) {
            return null;
        }

        if (!record.stored) {
            throw new Boom('Incorrect record structure');
        }

        const envelope = {
            item: record.value,
            stored: record.stored.getTime(),
            ttl: record.ttl
        };

        return envelope;
    }

    async set({ id, segment }, value, ttl) {

        if (!this.isConnectionStarted) {
            throw new Boom('Connection not started');
        }

        const collection = await this.getCollection(segment);
        const expiresAt = new Date();
        expiresAt.setMilliseconds(expiresAt.getMilliseconds() + ttl);

        const record = {
            value,
            stored: new Date(),
            ttl,
            expiresAt
        };

        const criteria = { _id: id };

        await collection.updateOne(criteria, { $set: record }, { upsert: true, safe: true });
    }

    async drop({ id, segment }) {

        if (!this.isConnectionStarted) {
            throw new Boom('Connection not started');
        }

        const collection = await this.getCollection(segment);

        const criteria = { _id: id };
        await collection.deleteOne(criteria, { safe: true });
    }
};
