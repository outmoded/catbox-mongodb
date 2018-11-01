'use strict';

// Load modules

const Code = require('code');
const Lab = require('lab');
const Catbox = require('catbox');
const Mongo = require('../lib');
const Mongodb = require('mongodb');


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const it = lab.test;
const after = lab.after;
const before = lab.before;
const expect = Code.expect;


describe('Mongo', () => {

    before(async () => {

        const client = await Mongodb.MongoClient.connect('mongodb://localhost:27017/unit-testing', {
            autoReconnect: false,
            poolSize: 4,
            useNewUrlParser: true
        });

        const db = client.db();
        await db.dropDatabase();
        await db.addUser('tester', 'secret', {
            roles: ['dbAdmin']
        });
        await client.close();
    });

    after(async () => {

        const client = await Mongodb.MongoClient.connect('mongodb://localhost:27017/unit-testing', {
            autoReconnect: false,
            poolSize: 4,
            useNewUrlParser: true
        });

        const db = client.db();
        await db.dropDatabase();
        await db.removeUser('tester');
        await client.close();
    });

    it('creates a new connection', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();
        expect(client.isReady()).to.equal(true);
    });

    it('closes the connection', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();
        expect(client.isReady()).to.equal(true);

        client.stop();
        expect(client.isReady()).to.equal(false);
    });

    it('gets an item after setting it', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        const key = { id: 'x', segment: 'test' };
        await client.set(key, '123', 500);
        const result = await client.get(key);

        expect(result.item).to.equal('123');
    });

    it('gets a falsy value like int 0', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        const key = { id: 'falsy', segment: 'test' };
        await client.set(key, 0, 20);
        const result = await client.get(key);

        expect(result.item).to.equal(0);
    });

    it('sets/gets following JS data types: Object, Array, Number, String, Date, RegExp', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        const key = { id: 'x', segment: 'test' };
        const value = {
            object: { a: 'b' },
            array: [1, 2, 3],
            number: 5.85,
            string: 'hapi',
            date: new Date('2014-03-07'),
            regexp: /[a-zA-Z]+/,
            boolean: false
        };

        await client.set(key, value, 500);
        const result = await client.get(key);

        expect(result.item).to.equal(value);
    });

    it('fails setting an item circular references', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        const key = { id: 'x', segment: 'test' };
        const value = { a: 1 };
        value.b = value;

        await expect(client.set(key, value, 10)).to.reject();
    });

    it('ignored starting a connection twice on same event', () => {

        const client = new Catbox.Client(Mongo);
        const start = async function () {

            await client.start();
            expect(client.isReady()).to.equal(true);
        };

        start();
        start();
    });

    it('ignored starting a connection twice chained', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();
        expect(client.isReady()).to.equal(true);

        await client.start();
        expect(client.isReady()).to.equal(true);
    });

    it('connects successfully after a failed connect attempt', { timeout: 4000 }, async () => {

        const options = {
            uri: 'mongodb://wrong-uri',
            partition: 'unit-testing'
        };

        const client = new Mongo(options);

        try {
            await client.start();
        }
        catch (err) {
            expect(err).to.exist();
            expect(err.message).to.include('getaddrinfo ENOTFOUND wrong-uri');
        }

        client.settings.uri = 'mongodb://127.0.0.1:27017/unit-testing?maxPoolSize=5';
        await client.start();
        expect(client.isReady()).to.equal(true);
    });

    it('returns not found on get when using null key', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        const result = await client.get(null);
        expect(result).to.equal(null);
    });

    it('returns not found on get when item expired', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        const key = { id: 'x', segment: 'test' };

        await client.set(key, 'x', 1);
        await new Promise((resolve) => {

            setTimeout(async () => {

                const result = await client.get(key);
                expect(result).to.equal(null);
                resolve();
            }, 2);
        });
    });

    it('returns error on set when using null key', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        await expect(client.set(null, {}, 1000)).to.reject();
    });

    it('returns error on get when using invalid key', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        await expect(client.get({})).to.reject();
    });

    it('returns error on drop when using invalid key', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        await expect(client.drop({})).to.reject();
    });

    it('returns error on set when using invalid key', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        await expect(client.set({}, {}, 1000)).to.reject();
    });

    it('ignores set when using non-positive ttl value', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        const key = { id: 'x', segment: 'test' };
        await client.set(key, 'y', 0);
    });

    it('returns error on drop when using null key', async () => {

        const client = new Catbox.Client(Mongo);
        await client.start();

        await expect(client.drop(null)).to.reject();
    });

    it('returns error on get when stopped', async () => {

        const client = new Catbox.Client(Mongo);
        client.stop();
        const key = { id: 'x', segment: 'test' };

        await expect(client.get(key)).to.reject();
    });

    it('returns error on set when stopped', async () => {

        const client = new Catbox.Client(Mongo);
        client.stop();
        const key = { id: 'x', segment: 'test' };

        await expect(client.set(key, 'y', 1)).to.reject();
    });

    it('returns error on drop when stopped', async () => {

        const client = new Catbox.Client(Mongo);
        client.stop();
        const key = { id: 'x', segment: 'test' };

        await expect(client.drop(key)).to.reject();
    });

    it('returns error on missing segment name', () => {

        const config = {
            expiresIn: 50000
        };

        const fn = () => {

            const client = new Catbox.Client(Mongo);
            new Catbox.Policy(config, client, '');
        };

        expect(fn).to.throw(Error);
    });

    it('returns error on bad segment name', () => {

        const config = {
            expiresIn: 50000
        };

        const fn = () => {

            const client = new Catbox.Client(Mongo);
            new Catbox.Policy(config, client, 'a\0b');
        };

        expect(fn).to.throw(Error);
    });

    it('returns error when cache item dropped while stopped', async () => {

        const client = new Catbox.Client(Mongo);
        client.stop();

        await expect(client.drop('a')).to.reject();
    });

    it('throws an error if not created with new', () => {

        const fn = () => {

            Mongo();
        };

        expect(fn).to.throw(Error);
    });

    it('throws an error when using a reserved partition name (admin)', () => {

        const fn = () => {

            const options = {
                partition: 'admin'
            };

            new Mongo(options);
        };

        expect(fn).to.throw(Error, 'Cache partition name cannot be "admin", "local", or "config" when using MongoDB');
    });

    it('throws an error when using a reserved partition name (local)', () => {

        const fn = () => {

            const options = {
                partition: 'local'
            };

            new Mongo(options);
        };

        expect(fn).to.throw(Error, 'Cache partition name cannot be "admin", "local", or "config" when using MongoDB');
    });

    describe('getSettings', () => {

        it('parse single host connection string without db', () => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017/unit-testing');
        });

        it('parse single host connection string without db with slash', () => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017/',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017/unit-testing');
        });

        it('parse single host connection string with credentials', () => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017/unit-testing?maxPoolSize=5');
        });

        it('parse single host connection string without credentials', () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/test?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://127.0.0.1:27017/unit-testing?maxPoolSize=5');
        });

        it('parse replica set in connection string without database', () => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/unit-testing');
        });

        it('parse replica set in connection string without database 2', () => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/unit-testing');
        });

        it('parse replica set in connection string with database', () => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/test',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/unit-testing');
        });

        it('parse replica set in connection string', () => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/?maxPoolSize=5&replicaSet=rs',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/unit-testing?maxPoolSize=5&replicaSet=rs');
        });

    });

    describe('start()', () => {

        it('returns a rejected promise when authentication fails', async () => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            await expect(mongo.start()).to.reject();
        });

        it('connects with authentication', async () => {

            const options = {
                uri: 'mongodb://tester:secret@127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            await mongo.start();
        });

        it('sets isReady to true when the connection succeeds', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            await mongo.start();
            expect(mongo.isReady()).to.be.true();
        });

        it('resolves all pending promises waiting for a start', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.start();
            await mongo.start();
            expect(mongo.isReady()).to.be.true();
        });
    });

    describe('validateSegmentName()', () => {

        it('returns an error when the name is empty', () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            expect(() => mongo.validateSegmentName('')).to.throw('Empty string');
        });

        it('returns an error when the name has a null character', () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            expect(() => mongo.validateSegmentName('\0test')).to.throw();
        });

        it('returns an error when the name starts with system.', () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            expect(() => mongo.validateSegmentName('system.')).to.throw('Begins with "system."');
        });

        it('returns an error when the name has a $ character', () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            expect(() => mongo.validateSegmentName('te$t')).to.throw('Contains "$"');
        });

        it('returns an error when the name is too long', () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            expect(() => mongo.validateSegmentName('0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789')).to.throw();
        });

        it('returns null when the name is valid', () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            expect(mongo.validateSegmentName('valid')).to.equal(null);
        });
    });

    describe('getCollection()', () => {

        it('returns a rejected promise when the connection is closed', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            await expect(mongo.getCollection('test')).to.reject('Connection not ready');
        });

        it('returns a collection', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            await mongo.start();
            const result = mongo.getCollection('test');
            expect(result).to.exist();
        });

        it('returns a rejected promise when there is an error getting the collection', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            await mongo.start();

            await expect(mongo.getCollection('')).to.reject();
        });

        it('returns a rejected promise when ensureIndex fails', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            await mongo.start();

            mongo.db.collection = (item) => {

                return Promise.resolve({
                    ensureIndex: (fieldOrSpec, options2) => {

                        return Promise.reject(new Error('test'));
                    }
                });
            };

            await expect(mongo.getCollection('testcollection')).to.reject();
        });
    });

    describe('get()', () => {

        it('returns a rejected promise when the connection is closed', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            await expect(mongo.get('test')).to.reject('Connection not started');
        });

        it('returns a null item when it doesn\'t exist', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            await mongo.start();
            const result = await mongo.get({ segment: 'test0', id: 'test0' });

            expect(result).to.equal(null);
        });

        it('is able to retrieve an object thats stored when connection is started', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const key = {
                id: 'test',
                segment: 'test'
            };

            const mongo = new Mongo(options);

            await mongo.start();
            await mongo.set(key, 'myvalue', 200);
            const result = await mongo.get(key);

            expect(result.item).to.equal('myvalue');
        });

        it('returns a rejected promise when there is an error returned from getting an item', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const key = {
                id: 'testerr',
                segment: 'testerr'
            };

            const mongo = new Mongo(options);
            mongo.isConnectionStarted = true;
            mongo.isConnected = true;

            mongo.collections.testerr = {
                findOne: (item) => {

                    return Promise.reject(new Error('test'));
                }
            };

            await expect(mongo.get(key)).to.reject('test');
        });

        it('returns a rejected promise when there is an issue with the record structure', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const key = {
                id: 'testerr',
                segment: 'testerr'
            };

            const mongo = new Mongo(options);
            mongo.isConnectionStarted = true;
            mongo.isConnected = true;

            mongo.collections.testerr = {
                findOne: (item) => {

                    return Promise.resolve({ stored: null });
                }
            };

            await expect(mongo.get(key)).to.reject('Incorrect record structure');
        });

        it('returns a rejected promise when not yet connected to MongoDB', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const key = {
                id: 'testerr',
                segment: 'testerr'
            };

            const mongo = new Mongo(options);
            mongo.isConnectionStarted = true;
            mongo.isConnected = false;

            mongo.collections.testerr = {
                findOne: (item) => {

                    return Promise.resolve({ value: false });
                }
            };

            await expect(mongo.get(key)).to.reject('Connection not ready');
        });
    });

    describe('set()', () => {

        it('returns a rejected promise when the connection is closed', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            await expect(mongo.set({ id: 'test1', segment: 'test1' }, 'test1', 3600)).to.reject('Connection not started');
        });

        it('doesn\'t return an error when the set succeeds', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            await mongo.start();
            const result = await mongo.set({ id: 'test1', segment: 'test1' }, 'test1', 3600);

            expect(result).to.not.exist();
        });

        it('returns a rejected promise when there is an error returned from setting an item', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const key = {
                id: 'testerr',
                segment: 'testerr'
            };

            const mongo = new Mongo(options);
            mongo.isConnectionStarted = true;
            mongo.isConnected = true;

            mongo.getCollection = (item) => {

                return Promise.reject(new Error('test'));
            };

            await expect(mongo.set(key, true, 0)).to.reject('test');
        });

        it('returns a rejected promise promise when there is an error returned from calling update', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const key = {
                id: 'testerr',
                segment: 'testerr'
            };

            const mongo = new Mongo(options);
            mongo.isConnectionStarted = true;
            mongo.isConnected = true;

            mongo.getCollection = (item) => {

                return Promise.resolve({
                    updateOne: (criteria, record, options2) => {

                        return Promise.reject(new Error('test'));
                    }
                });
            };

            await expect(mongo.set(key, true, 0)).to.reject('test');
        });
    });

    describe('drop()', () => {

        it('returns a rejected promise when the connection is closed', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            await expect(mongo.drop({ id: 'test2', segment: 'test2' })).to.reject('Connection not started');
        });

        it('doesn\'t return an error when the drop succeeds', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            await mongo.start();
            const result = await mongo.drop({ id: 'test2', segment: 'test2' });

            expect(result).to.not.exist();
        });

        it('returns a rejected promise when there is an error returned from dropping an item', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const key = {
                id: 'testerr',
                segment: 'testerr'
            };
            const mongo = new Mongo(options);
            mongo.isConnectionStarted = true;
            mongo.isConnected = true;

            mongo.getCollection = (item) => {

                return Promise.reject(new Error('test'));
            };

            await expect(mongo.drop(key)).to.reject('test');
        });

        it('returns a rejected promise when there is an error returned from calling remove', async () => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const key = {
                id: 'testerr',
                segment: 'testerr'
            };
            const mongo = new Mongo(options);
            mongo.isConnectionStarted = true;

            mongo.getCollection = (item) => {

                return Promise.resolve({
                    deleteOne: (criteria, safe) => {

                        return Promise.reject(new Error('test'));
                    }
                });
            };

            await expect(mongo.drop(key)).to.reject('test');
        });
    });
});
