"use strict";

const co = require('co');

const random = require('random-token');
const { DEFAULT_PREFIX, NAMESPACE } = require('./constants');

module.exports = function(opts) {
    const redis = opts.subClient;

    const key = `${opts.prefix || DEFAULT_PREFIX}:${NAMESPACE}`;

    return {
        getUploadUrl: co.wrap(function *(){
            let data = JSON.parse(yield redis.spop(key));

            return {
                filename: data[0],
                uploadUrl: data[1]
            }
        })
    }
};