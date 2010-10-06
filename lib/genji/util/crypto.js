/*!
 * Some shortcuts for crypto
 */

/**
 * Module dependencies
 */
var crypto = require('crypto');


module.exports = {
    md5: function (data, encoding) {
        return crypto.createHash('md5').update(data).digest(encoding || 'hex');
    },

    sha1: function(data, encoding) {
        return crypto.createHash('sha1').update(data).digest(encoding || 'hex');
    },

    hmac_sha1: function(data, key, encoding) {
        return crypto.createHmac('sha1', key).update(data).digest(encoding || 'hex');
    }
}