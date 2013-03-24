var genji = require('../index');
var assert = require('assert');

describe('Util', function () {

  describe('toArray', function () {
    it('should convert an array like object to array', function () {
      var obj = {};
      (function () {
        assert.deepEqual([1, '2', obj], genji.toArray(arguments));
      })(1, '2', obj);
    });
  });

  describe('extend', function () {
    it('should extend and override properties with same name', function () {
      var obj = {'a': 1};
      var t = new Date();
      var extended = genji.extend(obj, {b: '2', c: t}, {b: 4, e: 'e', f: false});
      assert.equal(obj, extended);
      assert.equal(obj.a, 1);
      assert.equal(obj.b, '4');
      assert.equal(t, extended.c);
      assert.equal('e', extended.e);
      assert.equal(false, extended.f);
    });
  });

  describe('byteLength', function () {
    it('should return correct length of utf8 string', function () {
      assert.equal(10, genji.byteLength('Hi, 北京！'));
    });
  });

});
