/*!
 * Some shortcuts for crypto
 */

/**
 * Module dependencies
 */
var crypto = require('crypto');

function _hashFile(alg, path, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding;
    encoding = undefined;
  }
  var stream = require('fs').createReadStream(path, {
    'flags': 'r',
    'encoding': 'binary',
    'mode': 0666,
    'bufferSize': 131072 //128k
  });
  var hash = crypto.createHash(alg);
  stream.on('data',
      function(chunk) {
        hash.update(chunk);
      }).on('end',
      function() {
        callback(null, hash.digest(encoding || 'hex'));
      }).on('error', function(err) {
        callback(err);
      });
}

module.exports = {
  md5: function (data, encoding) {
    return crypto.createHash('md5').update(data).digest(encoding || 'hex');
  },

  md5file: function(path, encoding, callback) {
    _hashFile('md5', path, encoding, callback);
  },

  sha1: function(data, encoding) {
    return crypto.createHash('sha1').update(data).digest(encoding || 'hex');
  },

  sha1file: function(path, encoding, callback) {
    _hashFile('sha1', path, encoding, callback);
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
};