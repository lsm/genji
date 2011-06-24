var c = require('../lib/control'),
    Chain = c.Chain,
    chain = c.chain,
    promise = c.promise,
    deferred = c.deferred,
    fs = require('fs');
var assert = require('assert');

module.exports = {
  'test executing the same function against different array members': function() {
    var res = 0;
    var c1 = chain([1, 2, 3], function(item, idx, arr, next, args) {
      res += item;
      next();
    });
    c1();
    assert.equal(res, 6);
  },

  'test chaining functions and call with order of FIFC': function() {
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

  'test chain name not exists': function() {
    var c3 = new Chain;
    assert.equal(c3.get('aa'), undefined); // should not be called
  },

  'test call function for specified times in serial': function() {
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
      chain({}, function() {
          });
    } catch(e) {
      assert.ok(e);
    }
  },

  'test promise': function(beforeExit) {
    var readFile = promise(fs.readFile);
    fs.readFile(__filename, function(err, data1) {
      if (err) throw err;
      readFile(__filename).when(function(err, data2) {
        if (err) throw err;
        assert.eql(data1, data2);
      });
    });
  },

  'test deferred': function(beforeExit) {
    var readFile = deferred(fs.readFile, fs), finished = false;
    fs.readFile(__filename, function(err, data1) {
      if (err) throw err;
      readFile(__filename)
          .then(function(data2) {
            assert.eql(data1, data2);
          })
          .then(function(data2) {
            assert.eql(data1, data2);
          })
          .and(function(data2) {
            assert.eql(data1, data2);
            this.next(10);
          })
          .and(function(data3) {
            assert.eql(data3, 10);
            return finished = true;
          })
          .done(function() {
            // done is called after second `and`
            assert.eql(finished, true);
          });
    });
  }
};