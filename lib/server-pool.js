"use strict";

const co = require('co');
const GoogleStorage = require('@google-cloud/storage');
const random = require('random-token');

const Forever = require('./forever');

const {DEFAULT_PREFIX, NAMESPACE} = require('./constants');


function ServerPool(opts) {
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

  this.run = () => {
    const q = new Forever(co.wrap(function *(){
      let recordsLeft = yield self.sub.scard(self.key);

      if (recordsLeft < POOL_SIZE)
        yield self.fillBuffer(Math.min(POOL_SIZE - recordsLeft, 20));

      yield self.sleep(100);
    }), 1);

    return q.run();
  };

}

ServerPool.prototype.fillBuffer = co.wrap(function* (size) {
  let tasks = [];
  let urls = [];

  console.log(`creating ${size} urls`);

  for (let i = 0; i < size; i++)
    urls.push(this.createUrl());

  urls = yield urls;

  console.log(`saving ${size} urls`);
  for(let i = 0; i < size; i++)
    tasks.push(this.pub.sadd(this.key, JSON.stringify(urls[i])));

  yield tasks;
  console.log(`done`);
});


ServerPool.prototype.createUrl = co.wrap(function* () {
  const filename = random(64);
  const file = this.bucket.file(this.basePath + filename);

  let url = yield file.createResumableUpload({public: true});

  return [filename, url[0]];
});


ServerPool.prototype.sleep = delay => new Promise(res => setTimeout(res, delay));


module.exports = ServerPool;