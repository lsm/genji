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
        var oe = options.outputEncode || 'hex';
        var c = crypto.createCipher(options.algorithm || 'aes256', key);
        return c.update(plain, options.inputEncode || 'utf8', oe) + c.final(oe);
    },

    decipher: function(cipher, key, options) {
        options = options || {};
        var oe = options.outputEncode || 'utf8';
        var d = crypto.createDecipher(options.algorithm || 'aes256', key);
        return d.update(cipher, options.inputEncode || 'hex', oe) + d.final(oe);
    }
}