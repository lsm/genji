var base64 = require('genji/util').base64;

module.exports = {
    'test base64 encoding end decoding': function(assert) {
        assert.equal(base64.encode('nihao'), 'bmloYW8=');
        assert.equal(base64.decode('bmloYW8='), 'nihao');
    }
}