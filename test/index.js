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

    before((done) => {

        const mongoDB = new Mongodb.Db('unit-testing', new Mongodb.Server('127.0.0.1', 27017, { auto_reconnect: false, poolSize: 4 }), { safe: false });
        mongoDB.open((err, db) => {

            expect(err).to.not.exist();
            db.dropDatabase((err) => {

                expect(err).to.not.exist();
                db.addUser('tester', 'secret', (err, result) => {

                    expect(err).to.not.exist();
                    db.close();
                    done();
                });
            });
        });
    });

    after((done) => {

        const mongoDB = new Mongodb.Db('unit-testing', new Mongodb.Server('127.0.0.1', 27017, { auto_reconnect: false, poolSize: 4 }), { safe: false });
        mongoDB.open((err, db) => {

            expect(err).to.not.exist();
            db.dropDatabase((err) => {

                expect(err).to.not.exist();
                db.removeUser('tester', (err, result) => {

                    expect(err).to.not.exist();
                    db.close();
                    done();
                });
            });
        });

    });

    it('creates a new connection', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            expect(client.isReady()).to.equal(true);
            done();
        });
    });

    it('closes the connection', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            expect(client.isReady()).to.equal(true);
            client.stop();
            expect(client.isReady()).to.equal(false);
            done();
        });
    });

    it('gets an item after setting it', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            const key = { id: 'x', segment: 'test' };
            client.set(key, '123', 500, (err) => {

                expect(err).to.not.exist();
                client.get(key, (err, result) => {

                    expect(err).to.equal(null);
                    expect(result.item).to.equal('123');
                    done();
                });
            });
        });
    });

    it('sets/gets following JS data types: Object, Array, Number, String, Date, RegExp', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            const key = { id: 'x', segment: 'test' };
            const value = {
                object: { a: 'b' },
                array: [1, 2, 3],
                number: 5.85,
                string: 'hapi',
                date: new Date('2014-03-07'),
                regexp: /[a-zA-Z]+/
            };

            client.set(key, value, 500, (err) => {

                expect(err).to.not.exist();
                client.get(key, (err, result) => {

                    expect(err).to.equal(null);
                    expect(result.item).to.deep.equal(value);
                    done();
                });
            });
        });
    });

    it('fails setting an item circular references', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            const key = { id: 'x', segment: 'test' };
            const value = { a: 1 };
            value.b = value;
            client.set(key, value, 10, (err) => {

                expect(err).to.exist();
                done();
            });
        });
    });

    it('ignored starting a connection twice on same event', (done) => {

        const client = new Catbox.Client(Mongo);
        let x = 2;
        const start = function () {

            client.start((err) => {

                expect(err).to.not.exist();
                expect(client.isReady()).to.equal(true);
                --x;
                if (!x) {
                    done();
                }
            });
        };

        start();
        start();
    });

    it('ignored starting a connection twice chained', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            expect(client.isReady()).to.equal(true);

            client.start((err) => {

                expect(err).to.not.exist();
                expect(client.isReady()).to.equal(true);
                done();
            });
        });
    });

    it('returns not found on get when using null key', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            client.get(null, (err, result) => {

                expect(err).to.equal(null);
                expect(result).to.equal(null);
                done();
            });
        });
    });

    it('returns not found on get when item expired', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            const key = { id: 'x', segment: 'test' };
            client.set(key, 'x', 1, (err) => {

                expect(err).to.not.exist();
                setTimeout(() => {

                    client.get(key, (err, result) => {

                        expect(err).to.equal(null);
                        expect(result).to.equal(null);
                        done();
                    });
                }, 2);
            });
        });
    });

    it('returns error on set when using null key', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            client.set(null, {}, 1000, (err) => {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on get when using invalid key', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            client.get({}, (err) => {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on drop when using invalid key', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            client.drop({}, (err) => {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on set when using invalid key', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            client.set({}, {}, 1000, (err) => {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('ignores set when using non-positive ttl value', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            const key = { id: 'x', segment: 'test' };
            client.set(key, 'y', 0, (err) => {

                expect(err).to.not.exist();
                done();
            });
        });
    });

    it('returns error on drop when using null key', (done) => {

        const client = new Catbox.Client(Mongo);
        client.start((err) => {

            expect(err).to.not.exist();
            client.drop(null, (err) => {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on get when stopped', (done) => {

        const client = new Catbox.Client(Mongo);
        client.stop();
        const key = { id: 'x', segment: 'test' };
        client.connection.get(key, (err, result) => {

            expect(err).to.exist();
            expect(result).to.not.exist();
            done();
        });
    });

    it('returns error on set when stopped', (done) => {

        const client = new Catbox.Client(Mongo);
        client.stop();
        const key = { id: 'x', segment: 'test' };
        client.connection.set(key, 'y', 1, (err) => {

            expect(err).to.exist();
            done();
        });
    });

    it('returns error on drop when stopped', (done) => {

        const client = new Catbox.Client(Mongo);
        client.stop();
        const key = { id: 'x', segment: 'test' };
        client.connection.drop(key, (err) => {

            expect(err).to.exist();
            done();
        });
    });

    it('returns error on missing segment name', (done) => {

        const config = {
            expiresIn: 50000
        };
        const fn = () => {

            const client = new Catbox.Client(Mongo);
            new Catbox.Policy(config, client, '');
        };
        expect(fn).to.throw(Error);
        done();
    });

    it('returns error on bad segment name', (done) => {

        const config = {
            expiresIn: 50000
        };
        const fn = () => {

            const client = new Catbox.Client(Mongo);
            new Catbox.Policy(config, client, 'a\0b');
        };
        expect(fn).to.throw(Error);
        done();
    });

    it('returns error when cache item dropped while stopped', (done) => {

        const client = new Catbox.Client(Mongo);
        client.stop();
        client.drop('a', (err) => {

            expect(err).to.exist();
            done();
        });
    });

    it('throws an error if not created with new', (done) => {

        const fn = () => {

            Mongo();
        };

        expect(fn).to.throw(Error);
        done();
    });

    it('throws an error when using a reserved partition name (admin)', (done) => {

        const fn = () => {

            const options = {
                partition: 'admin'
            };

            new Mongo(options);
        };

        expect(fn).to.throw(Error, 'Cache partition name cannot be "admin", "local", or "config" when using MongoDB');
        done();
    });

    it('throws an error when using a reserved partition name (local)', (done) => {

        const fn = () => {

            const options = {
                partition: 'local'
            };

            new Mongo(options);
        };

        expect(fn).to.throw(Error, 'Cache partition name cannot be "admin", "local", or "config" when using MongoDB');
        done();
    });

    describe('getSettings', () => {

        it('parse single host connection string without db', (done) => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017/unit-testing');

            done();
        });

        it('parse single host connection string without db with slash', (done) => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017/',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017/unit-testing');

            done();
        });

        it('parse single host connection string with credentials', (done) => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017/unit-testing?maxPoolSize=5');

            done();
        });

        it('parse single host connection string without credentials', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/test?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://127.0.0.1:27017/unit-testing?maxPoolSize=5');

            done();
        });

        it('parse replica set in connection string without database', (done) => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/unit-testing');

            done();
        });

        it('parse replica set in connection string without database 2', (done) => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/unit-testing');

            done();
        });

        it('parse replica set in connection string with database', (done) => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/test',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/unit-testing');

            done();
        });

        it('parse replica set in connection string', (done) => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/?maxPoolSize=5&replicaSet=rs',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);
            const settings = mongo.getSettings(options);

            expect(settings.uri).to.equal('mongodb://bob:password@127.0.0.1:27017,127.0.0.2:27017,127.0.0.3:27017/unit-testing?maxPoolSize=5&replicaSet=rs');

            done();
        });

    });

    describe('start()', () => {

        it('returns an error when authentication fails', (done) => {

            const options = {
                uri: 'mongodb://bob:password@127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            mongo.start((err) => {

                expect(err).to.exist();
                expect(err).to.be.instanceOf(Error);
                done();
            });
        });

        it('connects with authentication', (done) => {

            const options = {
                uri: 'mongodb://tester:secret@127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.start((err) => {

                expect(err).to.not.exist();
                done();
            });
        });

        it('sets isReady to true when the connection succeeds', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.start((err) => {

                expect(err).to.not.exist();
                expect(mongo.isReady()).to.be.true();
                done();
            });
        });

        it('calls any pending callbacks waiting for a start', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.start((err) => {

                expect(err).to.not.exist();
            });

            mongo.start((err) => {

                expect(err).to.not.exist();
                done();
            });
        });
    });

    describe('validateSegmentName()', () => {

        it('returns an error when the name is empty', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            const result = mongo.validateSegmentName('');

            expect(result).to.be.instanceOf(Error);
            expect(result.message).to.equal('Empty string');
            done();
        });

        it('returns an error when the name has a null character', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            const result = mongo.validateSegmentName('\0test');

            expect(result).to.be.instanceOf(Error);
            done();
        });

        it('returns an error when the name starts with system.', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };

            const mongo = new Mongo(options);

            const result = mongo.validateSegmentName('system.');

            expect(result).to.be.instanceOf(Error);
            done();
        });

        it('returns an error when the name has a $ character', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            const result = mongo.validateSegmentName('te$t');

            expect(result).to.be.instanceOf(Error);
            done();
        });

        it('returns an error when the name is too long', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            const result = mongo.validateSegmentName('0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789');

            expect(result).to.be.instanceOf(Error);
            done();
        });

        it('returns null when the name is valid', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            const result = mongo.validateSegmentName('hereisavalidname');

            expect(result).to.not.exist();
            done();
        });
    });

    describe('getCollection()', () => {

        it('passes an error to the callback when the connection is closed', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.getCollection('test', (err) => {

                expect(err).to.exist();
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal('Connection not ready');
                done();
            });
        });

        it('passes a collection to the callback', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.start(() => {

                mongo.getCollection('test', (err, result) => {

                    expect(err).to.not.exist();
                    expect(result).to.exist();
                    done();
                });
            });
        });

        it('passes an error to the callback when there is an error getting the collection', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.start(() => {

                mongo.getCollection('', (err, result) => {

                    expect(err).to.exist();
                    expect(result).to.not.exist();
                    done();
                });
            });
        });

        it('passes an error to the callback when ensureIndex fails', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.start(() => {

                mongo.db.collection = function (item, callback) {

                    return callback(null, {
                        ensureIndex: function (fieldOrSpec, options2, callback2) {

                            return callback2(new Error('test'));
                        }
                    });
                };

                mongo.getCollection('testcollection', (err, result) => {

                    expect(err).to.exist();
                    expect(result).to.not.exist();
                    done();
                });
            });
        });
    });

    describe('get()', () => {

        it('passes an error to the callback when the connection is closed', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.get('test', (err) => {

                expect(err).to.exist();
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal('Connection not started');
                done();
            });
        });

        it('passes a null item to the callback when it doesn\'t exist', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.start(() => {

                mongo.get({ segment: 'test0', id: 'test0' }, (err, result) => {

                    expect(err).to.not.exist();
                    expect(result).to.not.exist();
                    done();
                });
            });
        });

        it('is able to retrieve an object thats stored when connection is started', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const key = {
                id: 'test',
                segment: 'test'
            };

            const mongo = new Mongo(options);

            mongo.start(() => {

                mongo.set(key, 'myvalue', 200, (err) => {

                    expect(err).to.not.exist();
                    mongo.get(key, (err, result) => {

                        expect(err).to.not.exist();
                        expect(result.item).to.equal('myvalue');
                        done();
                    });
                });
            });
        });

        it('passes an error to the callback when there is no item', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27018/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const key = {
                id: 'test',
                segment: 'test'
            };
            const mongo = new Mongo(options);

            mongo.start(() => {

                mongo.get(key, (err, result) => {

                    expect(err).to.exist();
                    expect(result).to.not.exist();
                    done();
                });
            });
        });

        it('passes an error to the callback when there is an error returned from getting an item', (done) => {

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
                findOne: function (item, callback) {

                    return callback(new Error('test'));
                }
            };

            mongo.get(key, (err, result) => {

                expect(err).to.exist();
                expect(err.message).to.equal('test');
                expect(result).to.not.exist();
                done();
            });
        });

        it('passes an error to the callback when there is an issue with the record structure', (done) => {

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
                findOne: function (item, callback) {

                    return callback(null, { value: false });
                }
            };

            mongo.get(key, (err, result) => {

                expect(err).to.exist();
                expect(err.message).to.equal('Incorrect record structure');
                expect(result).to.not.exist();
                done();
            });
        });

    });

    describe('set()', () => {

        it('passes an error to the callback when the connection is closed', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.set({ id: 'test1', segment: 'test1' }, 'test1', 3600, (err) => {

                expect(err).to.exist();
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal('Connection not started');
                done();
            });
        });

        it('doesn\'t return an error when the set succeeds', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.start(() => {

                mongo.set({ id: 'test1', segment: 'test1' }, 'test1', 3600, (err, result) => {

                    expect(err).to.not.exist();
                    expect(result).to.not.exist();
                    done();
                });
            });
        });

        it('passes an error to the callback when there is an error returned from setting an item', (done) => {

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

            mongo.getCollection = (item, callback) => {

                return callback(new Error('test'));
            };

            mongo.set(key, true, 0, (err, result) => {

                expect(err).to.exist();
                expect(err.message).to.equal('test');
                expect(result).to.not.exist();
                done();
            });
        });

        it('passes an error to the callback when there is an error returned from calling update', (done) => {

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

            mongo.getCollection = (item, callback) => {

                return callback(null, {
                    update: function (criteria, record, options2, cb) {

                        return cb(new Error('test'));
                    }
                });
            };

            mongo.set(key, true, 0, (err, result) => {

                expect(err).to.exist();
                expect(err.message).to.equal('test');
                expect(result).to.not.exist();
                done();
            });
        });
    });

    describe('drop()', () => {

        it('passes an error to the callback when the connection is closed', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.drop({ id: 'test2', segment: 'test2' }, (err) => {

                expect(err).to.exist();
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal('Connection not started');
                done();
            });
        });

        it('doesn\'t return an error when the drop succeeds', (done) => {

            const options = {
                uri: 'mongodb://127.0.0.1:27017/?maxPoolSize=5',
                partition: 'unit-testing'
            };
            const mongo = new Mongo(options);

            mongo.start(() => {

                mongo.drop({ id: 'test2', segment: 'test2' }, (err, result) => {

                    expect(err).to.not.exist();
                    expect(result).to.not.exist();
                    done();
                });
            });
        });

        it('passes an error to the callback when there is an error returned from dropping an item', (done) => {

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

            mongo.getCollection = function (item, callback) {

                return callback(new Error('test'));
            };

            mongo.drop(key, (err, result) => {

                expect(err).to.exist();
                expect(err.message).to.equal('test');
                expect(result).to.not.exist();
                done();
            });
        });

        it('passes an error to the callback when there is an error returned from calling remove', (done) => {

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

            mongo.getCollection = function (item, callback) {

                return callback(null, {
                    remove: function (criteria, safe, cb) {

                        return cb(new Error('test'));
                    }
                });
            };

            mongo.drop(key, (err, result) => {

                expect(err).to.exist();
                expect(err.message).to.equal('test');
                expect(result).to.not.exist();
                done();
            });
        });
    });
});
