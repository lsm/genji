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
    },

    cipher: function(plain, key, options) {
        options = options || {};
        var oe = options.outputEncoding || 'hex';
        var c = crypto.createCipher(options.algorithm || 'aes256', key);
        return c.update(plain, options.inputEncoding || 'utf8', oe) + c.final(oe);
    },

    decipher: function(cipher, key, options) {
        options = options || {};
        var oe = options.outputEncoding || 'utf8';
        var d = crypto.createDecipher(options.algorithm || 'aes256', key);
        return d.update(cipher, options.inputEncoding || 'hex', oe) + d.final(oe);
    }
}