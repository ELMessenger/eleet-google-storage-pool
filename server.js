"use strict";

const path = require('path');
const config = require('./lib/config');
const ServerPool = require('./lib/server-pool');

const Redis = require('ioredis');

const pubClient = new Redis({
    port: config.get('redis:master:port'),
    host: config.get('redis:master:host'),
    family: 4,
    password: config.get("redis:master:password"),
    //db: config.get(`redis:prefix`) + config.get('redis:dbname')
});

const subClient = new Redis({
    port: config.get('redis:slave:port'),
    host: config.get('redis:slave:host'),
    family: 4,
    password: config.get("redis:slave:password"),
    //db: config.get(`redis:prefix`) + config.get('redis:dbname')
});

const server = new ServerPool({
    pubClient,
    subClient,
    poolSize: config.get('POOL_SIZE'),
    gcs: {
        keyFilename: path.join(__dirname, config.get("gcs:keyFilename")),
        projectId: config.get('gcs:projectId'),
        bucket: config.get('gcs:bucket')
    }
});

server.run(config.get('INTERVAL'));

console.log("Pool server in runned");