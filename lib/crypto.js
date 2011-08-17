/*!
 * Some shortcuts for crypto
 */

/**
 * Module dependencies
 */
var crypto = require('crypto');
var fs = require('fs');

function _hashFile(alg, path, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding;
    encoding = undefined;
  }
  var stream = fs.createReadStream(path);
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

  hmac: function(algo, data, key, encoding) {
    return crypto.createHmac(algo, key).update(data).digest(encoding || 'hex');
  },

  hmac_sha1: function(data, key, encoding) {
    return module.exports.hmac('sha1', data, key, encoding);
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
  },
  base64Encode: function(input, inputEncoding) {
    var buf = new Buffer(input, inputEncoding || 'utf8');
    return buf.toString('base64');
  },

  base64Decode: function(input, outputEncoding) {
    var base64 = new Buffer(input, 'base64');
    return base64.toString(outputEncoding || 'utf8');
  }
};