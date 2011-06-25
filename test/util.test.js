var genji = require('genji');
var util = genji.require('util');
var assert = require('assert');

module.exports = {
  'test base64 encoding end decoding': function() {
    assert.equal(util.base64Encode('你好'), '5L2g5aW9');
    assert.equal(util.base64Decode('5L2g5aW9'), '你好');
  },

  'test util#toArray': function() {
    var obj = {};
    (function() {
      assert.eql([1, '2', obj], util.toArray(arguments));
    })(1, '2', obj);
  },

  'test util#extend': function() {
    var obj = {'a': 1};
    var t = new Date;
    var extended = util.extend(obj, {b: '2', c: t});
    assert.eql(obj, extended);
    assert.eql(obj.a, 1);
    assert.eql(obj.b, '2');
    assert.eql(t, extended.c);
  }
};