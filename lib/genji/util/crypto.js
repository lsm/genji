/*!
 * Some shortcuts for crypto
 */

/**
 * Module dependencies
 */
var crypto = require('crypto');


module.exports = {
    md5: function (data) {
        return crypto.createHash('md5').update(data).digest('hex');
    },

    sha1: function(data) {
        return crypto.createHash('sha1').update(data).digest('hex');
    },

    hmac_sha1: function(data, key) {
        return crypto.createHmac('sha1', key).update(data).digest('hex');
    }
}