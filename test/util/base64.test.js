var base64 = require('genji/util').base64;

module.exports = {
    'test base64 encoding end decoding': function(assert) {
        assert.equal(base64.encode('你好'), '5L2g5aW9');
        assert.equal(base64.decode('5L2g5aW9'), '你好');
    }
}