var genji = require('genji');
var c = genji.require('control'),
    Chain = c.Chain,
    chain = c.chain,
    promise = c.promise,
    defer = c.defer,
    parallel = c.parallel,
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

  'test control#parallel': function() {
    var array = [2, 3, 4];
    var finishedOrder = [];

    function each(item, idx, arr, callback) {
      setTimeout(function() {
        assert.eql(array, arr);
        finishedOrder.push(idx);
        callback(null, idx);
      }, (1 / item) * 100);
    }

    function done(result) {
      assert.eql([2, 1, 0], finishedOrder);
      // order is reserved for result
      assert.eql([0, 1, 2], result);
    }

    parallel(array, each, done);

    var finishedOrder2 = [];

    function each2(item, idx, arr, callback) {
      setTimeout(function() {
        assert.eql(array, arr);
        finishedOrder2.push(idx);
        callback(null, idx * 10);
      }, (1 / item) * 100);
    }

    parallel(array, each2).done(function(result) {
      assert.eql([2, 1, 0], finishedOrder2);
      assert.eql([0, 10, 20], result);
    });

    var finishedOrder3 = [];

    function each3(item, idx, arr, callback) {
      setTimeout(function() {
        assert.eql(array, arr);
        finishedOrder3.push(idx);
        if (item === 3) {
          callback('error');
        } else {
          callback(null, idx * 10);
        }
      }, (1 / item) * 100);
    }

    parallel(array, each3).done(
        function(result) {
          assert.eql([2, 1, 0], finishedOrder3);
          assert.isUndefined(result[1]);
        }).fail(function(err, item, idx) {
          assert.eql('error', err);
          assert.eql(item, 3);
          assert.eql(idx, 1);
        });

    parallel([1, 2, 3, 4], function(item, idx, arr, callback) {
      if (item !== 3) {
        callback(null, item*10);
      }
    })
      .done(function(result) {
        // this should never be called
        assert.eql(false, true);
      })
      .timeout(function(result) {
      assert.eql(-1, result.indexOf(30));
      }, 1);
  },

  'test promise': function() {
    var readFile = promise(fs.readFile);
    fs.readFile(__filename, function(err, data1) {
      if (err) throw err;
      readFile(__filename).when(function(err, data2) {
        if (err) throw err;
        assert.eql(data1, data2);
      });
    });
  },

  'test control#defer': function() {
    var readFile = defer(fs.readFile, fs), finished = false;
    fs.readFile(__filename, function(err, data1) {
      if (err) throw err;
      readFile(__filename)
          .then(function(data2) {
            assert.eql(data1, data2);
          })
          .then(function(data2) {
            assert.eql(data1, data2);
          })
          .and(function(defer, data2) {
            assert.eql(data1, data2);
            defer.next(10);
          })
          .and(function(defer, data3) {
            assert.eql(data3, 10);
            return finished = true;
          })
          .done(function() {
            // done is called after second `and`
            assert.eql(finished, true);
          });
      readFile(__filename + '1').fail(function(err) {
        assert.eql('ENOENT', err.code);
      });
    });
  },

  'test control#defer with ordered `and`, `then` callbacks': function() {
    function asyncFn(x, callback) {
      setTimeout(function() {
        callback(null, x + 1);
      }, 1000);
    }

    var fn = defer(asyncFn);
    var then1 = 0;
    var then2 = 0;
    fn(10)
        .and(function(defer, result) {
          assert.eql(11, result);
          defer.next(result + 1);
        })
        .and(function(defer, result) {
          assert.eql(12, result);
          defer.next(result + 2);
        })
        .and(function(defer, result) {
          assert.eql(14, result);
          defer.next(14);
        })
        .then(function(result) {
          then1 = result * 2;
        })
        .then(function(result) {
          assert.eql(14, result);
          then2 = then1 * 2;
        })
        .and(function() {
          assert.eql(28, then1);
          assert.eql(56, then2);
        });
  },

  'test control#defer register many callbacks': function() {
    function asyncFn(x, callback) {
      setTimeout(function() {
        callback(null, x + 1);
      }, 1000);
    }

    var fn = defer(asyncFn);

    function fn1(defer, result) {
      assert.eql(11, result);
      defer.next(result + 1);
    }

    function fn2(defer, result) {
      assert.eql(12, result);
      defer.next(result + 2);
    }

    function fn3(result) {
      assert.eql(14, result);
    }

    function fn4(result) {
      assert.eql(14, result);
    }

    fn(10).and(fn1, fn2).then(fn3, fn4);
  }
};