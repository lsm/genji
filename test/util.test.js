var util = require('../lib/util');
var assert = require('assert');

module.exports = {
  'test base64 encoding end decoding': function() {
    assert.equal(util.base64Encode('你好'), '5L2g5aW9');
    assert.equal(util.base64Decode('5L2g5aW9'), '你好');
  }
}