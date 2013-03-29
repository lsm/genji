var genji = require('../index');
var crypto = genji.crypto;
var assert = require('assert');

describe('Crypto', function () {

  it('should hash md5 to hex string', function () {
    assert.equal('202cb962ac59075b964b07152d234b70', crypto.md5('123'));
  });

  it('should hash file to md5 hex string', function () {
    crypto.md5file('./test/view/hashfile.html', 'hex', function (err, hex) {
      assert.equal(null, err);
      assert.equal('894f3eee0b8ff321748f97eff3d9805e', hex);
    });
    crypto.md5file('./test/view/hashfile.html', function (err, hex) {
      assert.equal(null, err);
      assert.equal('894f3eee0b8ff321748f97eff3d9805e', hex);
    });
  });

  it('should hash sha1 to hex string', function () {
    assert.equal('40bd001563085fc35165329ea1ff5c5ecbdbbeef', crypto.sha1('123'));
  });

  it('should hash file to sha1 hex string', function () {
    crypto.sha1file('./test/view/hashfile.html', 'hex', function (err, hex) {
      assert.equal(null, err);
      assert.equal('d370f9a9e3babf48bd9e4cd4f77bfd5ffef592b0', hex);
    });
    crypto.sha1file('./test/hashfile-noexistent', function (err, hex) {
      assert.equal('ENOENT', err.code);
    });
  });

  it('should hash hmac sha1 to hex string', function () {
    assert.equal('104152c5bfdca07bc633eebd46199f0255c9f49d', crypto.hmac_sha1('data', 'key', 'hex'));
  });

  it('should cipher/decipher', function () {
    var hash = crypto.cipher('plain', 'key');
    assert.equal('plain', crypto.decipher(hash, 'key'));
  });

  it('should hash md5 to hex string', function () {
    assert.equal('202cb962ac59075b964b07152d234b70', crypto.md5('123'));
  });

  it('should encode and decode base64', function () {
    assert.equal(crypto.base64Encode('你好'), '5L2g5aW9');
    assert.equal(crypto.base64Decode('5L2g5aW9'), '你好');
  });
});
