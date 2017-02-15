"use strict";

const co = require('co');

const GoogleStorage = require('@google-cloud/storage');
const random = require('random-token');

const { DEFAULT_PREFIX, NAMESPACE } = require('./constants');


function ServerPool(opts){
    this.pub = opts.pubClient;
    this.sub = opts.subClient;

    const POOL_SIZE = opts.poolSize;

    this.key = `${opts.prefix || DEFAULT_PREFIX}:${NAMESPACE}`;
    this.basePath = opts.basePath ? (opts.basePath + '/') : '';

    this.gcs = GoogleStorage({
        projectId: opts.gcs.projectId,
        keyFilename: opts.gcs.keyFilename
    });

    this.bucket = this.gcs.bucket(opts.gcs.bucket);

    const self = this;

    this.run = co.wrap(function *(interval = 100){
        while(true){
            let recordsLeft = yield self.sub.scard(self.key);

            if(recordsLeft < POOL_SIZE)
                yield self.fillBuffer(POOL_SIZE - recordsLeft);

            yield self.sleep(interval);
        }
    });

}

ServerPool.prototype.fillBuffer = co.wrap(function *(size){
    let tasks = [];

    for(let i = 0; i < size; i++){
        let data = yield this.createUrl();
        console.log("url created");
        tasks.push(this.pub.sadd(this.key, JSON.stringify(data)));
    }

    console.log(`creating ${size} urls...`);

    yield tasks;

    console.log(`done`);
});


ServerPool.prototype.createUrl = co.wrap(function *() {
    const filename = random(64);
    const file = this.bucket.file(this.basePath + filename);

    let url = yield file.createResumableUpload({ public: true });

    return [filename, url[0]];
});


ServerPool.prototype.sleep = delay => new Promise(res => setTimeout(res, delay));


module.exports = ServerPool;