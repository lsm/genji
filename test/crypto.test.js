var genji = require('genji');
var crypto = genji.require('crypto');
var assert = require('assert');

module.exports = {
  'test Crypto#md5': function() {
    assert.eql('202cb962ac59075b964b07152d234b70', crypto.md5('123'));
  },

  'test Crypto#md5file': function() {
    crypto.md5file('./test/hashfile', 'hex', function(err, hex) {
      assert.eql(null, err);
      assert.eql('894f3eee0b8ff321748f97eff3d9805e', hex);
    });
    crypto.md5file('./test/hashfile', function(err, hex) {
      assert.eql(null, err);
      assert.eql('894f3eee0b8ff321748f97eff3d9805e', hex);
    });
  },

  'test Crypto#sha1': function() {
    assert.eql('40bd001563085fc35165329ea1ff5c5ecbdbbeef', crypto.sha1('123'));
  },

  'test Crypto#sha1file': function() {
    crypto.sha1file('./test/hashfile', 'hex', function(err, hex) {
      assert.eql(null, err);
      assert.eql('d370f9a9e3babf48bd9e4cd4f77bfd5ffef592b0', hex);
    });
    crypto.sha1file('./test/hashfile-noexistent', function(err, hex) {
      assert.eql('ENOENT', err.code);
    });
  },

  'test Crypto#hmac_sha1': function() {
    assert.eql('104152c5bfdca07bc633eebd46199f0255c9f49d', crypto.hmac_sha1('data', 'key', 'hex'));
  },

  'test Crypto#cipher/decipher': function() {
    var hash = crypto.cipher('plain', 'key');
    assert.eql('plain', crypto.decipher(hash, 'key'));
  },

  'test base64 encoding end decoding': function() {
    assert.equal(crypto.base64Encode('你好'), '5L2g5aW9');
    assert.equal(crypto.base64Decode('5L2g5aW9'), '你好');
  }
};