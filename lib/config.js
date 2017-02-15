"use strict";

const nconf = require('nconf');
const path = require('path');

module.exports = (function() {
    var nodeEnv = process.env.NODE_ENV || 'development';
    var eleetEnv = process.env.ELEET_ENV ? ('_' + process.env.ELEET_ENV) : '';

    if(nodeEnv == 'development')
        eleetEnv = eleetEnv || '_local';

    nconf.file('app', {file: path.join(__dirname, '../env/' + nodeEnv + eleetEnv + '.json')});

    return nconf.argv().env();
})();