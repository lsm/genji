
var benchmark = require('genji/util/benchmark');


module.exports = {
    'test benchmark': function(assert) {
        var a = [1,2,3,4,5], b = [], c = [];
        var bm = benchmark.create('Compare for and forEach', [function() {
            for (var i = 0; i < a.length; i++) {
                b.push(a[i]);
            }
        }, function() {
            a.forEach(function(item) {
                c.push(item);
            });
        }]);
        bm(50000); // run half million times
        assert.equal(b.length, 250000);
        assert.equal(c.length, 250000);
        assert.eql(c, b);
    }
}