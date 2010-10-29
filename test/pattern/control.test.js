var c = require('genji/pattern/control'),
Chain = c.Chain,
chain = c.chain,
promise = c.promise,
fs = require('fs');

module.exports = {
    'test executing the same function against different array members': function(assert) {
        var res = 0;
        var c1 = chain([1, 2, 3], function(item, idx, arr, next, args) {
            res += item;
            next();
        });
        c1();
        assert.equal(res, 6);
    },

    'test chaining functions and call with order of FIFC': function(assert) {
        var c2 = new Chain, res = 0, order = [];
        c2.add('fc', function(n) {
            res += n;
            order.push(0);
            this.next(res);
        });
        c2.add('fc', function(n) {
            res += n;
            order.push(1);
            return res; // == this.next(1);
        });
        c2.add('fc', function(n) {
            res += n;
            order.push(2);
            this.next(res);
        });
        c2.get('fc')(1);
        assert.equal(res, 3);
        assert.eql(order, [0,1,2]);
    },

    'test chain name not exists': function(assert) {
        try {
            var c3 = new Chain;
            c3.get('aa');
            assert.equal(1, 2); // should not be called
        } catch (e) {
            assert.equal(e.message, 'Chain named aa not exists.');
        }
    },

    'test call function for specified times in serial': function(assert) {
        var count = 0;
        var c4 = chain(6, function(item, idx, arr, next) {
            assert.eql(item, undefined);
            assert.eql(arr, 6);
            count++;
            next();
        });
        c4();
        assert.equal(count, 6);
        try {
            chain({}, function() {});
        } catch(e) {
            assert.ok(e);
        }
    },

    'test promise': function(assert, beforeExit) {
        var readFile = promise(fs.readFile), finished;
        fs.readFile(__filename, function(err, data1) {
            if (err) throw err;
            readFile(__filename).then(function(err, data2) {
                if (err) throw err;
                assert.eql(data1, data2);
            });
        });
    }
};