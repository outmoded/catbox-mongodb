'use strict';

// Load modules

const MongoDB = require('mongodb');
const Hoek = require('hoek');


// Declare internals

const internals = {};


internals.defaults = {
    uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5'
};


exports = module.exports = internals.Connection = function (options) {

    Hoek.assert(this instanceof internals.Connection, 'MongoDB cache client must be instantiated using new');

    this.settings = this.getSettings(options);

    this.db = null;
    this.isConnectionStarted = false;
    this.isConnected = false;
    this.collections = {};
    this.startPending = null;           // Set to an array of callbacks if start pending
    return this;
};

internals.Connection.prototype.getSettings = function (options) {
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
};

internals.Connection.prototype.start = function (callback) {

    // Check if already connected

    if (this.isConnected) {
        return callback();
    }

    // Check if start already pending

    if (this.startPending) {
        this.startPending.push(callback);
        return;
    }

    // Set start pending state

    this.startPending = [callback];

    const connected = (err) => {

        this.isConnected = !err;

        for (let i = 0; i < this.startPending.length; ++i) {
            this.startPending[i](err);
        }

        this.startPending = null;
    };

    // Connection started flag
    this.isConnectionStarted = true;

    // Open connection

    MongoDB.MongoClient.connect(this.settings.uri, (err, db) => {

        if (err) {
            return connected(new Error('Failed opening connection:' + JSON.stringify(err)));
        }

        this.db = db;

        return connected();
    });
};


internals.Connection.prototype.stop = function () {

    if (this.db) {
        this.db.close();
        this.db = null;
        this.collections = {};
        this.isConnected = false;
        this.isConnectionStarted = false;
    }
};


internals.Connection.prototype.isReady = function () {

    return this.isConnected;
};


internals.Connection.prototype.validateSegmentName = function (name) {

    /*
     Collection names:

     - empty string is not valid
     - cannot contain "\0"
     - avoid creating any collections with "system." prefix
     - user created collections should not contain "$" in the name
     - database name + collection name < 100 (actual 120)
     */

    if (!name) {
        return new Error('Empty string');
    }

    if (name.indexOf('\0') !== -1) {
        return new Error('Includes null character');
    }

    if (name.indexOf('system.') === 0) {
        return new Error('Begins with "system."');
    }

    if (name.indexOf('$') !== -1) {
        return new Error('Contains "$"');
    }

    if (name.length + this.settings.partition.length >= 100) {
        return new Error('Segment and partition name lengths exceeds 100 characters');
    }

    return null;
};


internals.Connection.prototype.getCollection = function (name, callback) {

    if (!this.isConnected) {
        return callback(new Error('Connection not ready'));
    }

    if (this.collections[name]) {
        return callback(null, this.collections[name]);
    }

    // Fetch collection


    this.db.collection(name, (err, collection) => {

        if (err) {
            return callback(err);
        }

        // Found
        collection.ensureIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }, (err) => {

            if (err) {
                return callback(err);
            }

            this.collections[name] = collection;
            return callback(null, collection);
        });
    });
};


internals.Connection.prototype.get = function (key, callback) {

    if (!this.isConnectionStarted) {
        return callback(new Error('Connection not started'));
    }

    this.getCollection(key.segment, (err, collection) => {

        if (err) {
            return callback(err);
        }

        const criteria = { _id: key.id };
        collection.findOne(criteria, (err, record) => {

            if (err) {
                return callback(err);
            }

            if (!record) {
                return callback(null, null);
            }

            if (!record.value ||
                !record.stored) {

                return callback(new Error('Incorrect record structure'));
            }

            const envelope = {
                item: record.value,
                stored: record.stored.getTime(),
                ttl: record.ttl
            };

            return callback(null, envelope);
        });
    });
};


internals.Connection.prototype.set = function (key, value, ttl, callback) {

    if (!this.isConnectionStarted) {
        return callback(new Error('Connection not started'));
    }

    this.getCollection(key.segment, (err, collection) => {

        if (err) {
            return callback(err);
        }

        const expiresAt = new Date();
        expiresAt.setMilliseconds(expiresAt.getMilliseconds() + ttl);
        const record = {
            _id: key.id,
            value: value,
            stored: new Date(),
            ttl: ttl,
            expiresAt: expiresAt
        };

        const criteria = { _id: key.id };
        collection.update(criteria, record, { upsert: true, safe: true }, (err, count) => {

            if (err) {
                return callback(err);
            }

            return callback();
        });
    });
};


internals.Connection.prototype.drop = function (key, callback) {

    if (!this.isConnectionStarted) {
        return callback(new Error('Connection not started'));
    }

    this.getCollection(key.segment, (err, collection) => {

        if (err) {
            return callback(err);
        }

        const criteria = { _id: key.id };
        collection.remove(criteria, { safe: true }, (err, count) => {

            if (err) {
                return callback(err);
            }

            return callback();
        });
    });
};
