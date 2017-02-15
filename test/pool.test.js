"use strict";

const path = require('path');
const co = require('co');
const chai = require('chai');

chai.should();

const ServerPool = require('../lib/server-pool');
const ClientPool = require('../lib/client-pool');


const RedisMock = require('ioredis-mock').default;

describe('test pool', () => {

    const keyFilename = path.join(__dirname, '../keys/google-storage.json');
    const projectId = 'x';

    const POOL_SIZE = 5;
    let serverPool, redis;

    beforeEach(co.wrap(function *(){
        redis = new RedisMock();
        serverPool = createServerPool(redis, POOL_SIZE);
    }));

    it('should create url', co.wrap(function *(){
        let result = yield serverPool.createUrl();

        result[0].should.have.length(64);
        result[1].should.be.match(/https:\/\//);
    }));

    it('should fill pool', co.wrap(function *(){
        yield serverPool.fillBuffer(5);

        let members = yield redis.smembers(serverPool.key);
        members.should.have.length(5);

        for(let i = 0; i < 5; i++){
            checkResult(members[i]);
        }

    }));


    it('should pop url', co.wrap(function *(){
        yield serverPool.fillBuffer(POOL_SIZE);
        const clientPool = ClientPool({ subClient: redis });

        let result = yield clientPool.getUploadUrl();
        result.should.have.property('filename').with.length(64);
        result.should.have.property('uploadUrl').with.match(/https:\/\//);

        let size = yield redis.scard(serverPool.key);
        size.should.be.equal(POOL_SIZE - 1);
    }));

    it('should fill buffer in realtime', co.wrap(function *(){
        serverPool.run();

        yield sleep(2000);

        const clientPool = ClientPool({ subClient: redis });

        yield clientPool.getUploadUrl();

        yield sleep(1000);

        let size = yield redis.scard(serverPool.key);
        size.should.be.equal(POOL_SIZE);

    }));

    function sleep(delay) {
        return new Promise(res => setTimeout(res, delay));
    }


    function checkResult(data){
        data = JSON.parse(data);

        data[0].should.have.length(64);
        data[1].should.be.match(/https:\/\//);
    }


    function createServerPool(redis, poolSize){

        return new ServerPool({
            pubClient: redis,
            subClient: redis,
            poolSize,
            gcs: {
                keyFilename,
                projectId,
                bucket: 'eleet'
            }
        });
    }

});