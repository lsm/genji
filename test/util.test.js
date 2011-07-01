var genji = require('genji');
var util = genji.require('util');
var assert = require('assert');

module.exports = {
  'test util#toArray': function() {
    var obj = {};
    (function() {
      assert.eql([1, '2', obj], util.toArray(arguments));
    })(1, '2', obj);
  },

  'test util#extend': function() {
    var obj = {'a': 1};
    var t = new Date;
    var extended = util.extend(obj, {b: '2', c: t}, {b: 4, e: 'e', f: false});
    assert.eql(obj, extended);
    assert.eql(obj.a, 1);
    assert.eql(obj.b, '4');
    assert.eql(t, extended.c);
    assert.eql('e', extended.e);
    assert.eql(false, extended.f);
  }
};