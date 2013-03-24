var genji = require('../index');
var Chain = genji.Chain;
var chain = genji.chain;
var promise = genji.promise;
var defer = genji.defer;
var parallel = genji.parallel;
var fs = require('fs');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;


describe('Control', function () {

  describe('.chain', function () {
    it('should executing the same function against different array members', function () {
      var res = 0;
      var c1 = chain([1, 2, 3], function (item, idx, arr, next, args) {
        res += item;
        next();
      });
      c1();
      assert.equal(res, 6);
    });

    it('should call function for specified times in serial', function () {
      var count = 0;
      var c4 = chain(6, function (item, idx, arr, next) {
        assert.equal(item, undefined);
        assert.equal(arr, 6);
        count++;
        next();
      });
      c4();
      assert.equal(count, 6);
      try {
        chain({}, function () {
        });
      } catch (e) {
        assert.ok(e);
      }
    });
  });

  describe('.Chain', function () {

    it('should add functions in chain and call with order of FIFC', function () {
      var c2 = new Chain, res = 0, order = [];
      c2.add('fc', function (n, next) {
        res += n;
        order.push(0);
        next(res);
      });
      c2.add('fc', function (n) {
        res += n;
        order.push(1);
        return res; // == this.next(1);
      });
      c2.add('fc', function (n, next) {
        res += n;
        order.push(2);
        next(res);
      });
      c2.get('fc')(1);
      assert.equal(res, 3);
      assert.deepEqual(order, [0, 1, 2]);
    });

    it('should return undefined if chain name not exists', function () {
      var c3 = new Chain();
      assert.equal(c3.get('aa'), undefined); // should not be called
    });
  });

  describe('.parallel', function () {
    it('should iterate items and call done after finish the iteration', function (_done) {
      var array = [2, 3, 4];
      var finishedOrder = [];

      function each(item, idx, arr, callback) {
        setTimeout(function () {
          assert.equal(array, arr);
          finishedOrder.push(idx);
          callback(null, idx);
        }, (1 / item) * 100);
      }

      function done(result) {
        assert.deepEqual([2, 1, 0], finishedOrder);
        // order is reserved for result
        assert.deepEqual([0, 1, 2], result);
      }

      parallel(array, each, done);

      var finishedOrder2 = [];

      function each2(item, idx, arr, callback) {
        setTimeout(function () {
          assert.deepEqual(array, arr);
          finishedOrder2.push(idx);
          callback(null, idx * 10);
        }, (1 / item) * 100);
      }

      parallel(array, each2).done(function (result) {
        assert.deepEqual([2, 1, 0], finishedOrder2);
        assert.deepEqual([0, 10, 20], result);
      });

      var finishedOrder3 = [];

      function each3(item, idx, arr, callback) {
        setTimeout(function () {
          assert.deepEqual(array, arr);
          finishedOrder3.push(idx);
          if (item === 3) {
            callback('error');
          } else {
            callback(null, idx * 10);
          }
        }, (1 / item) * 100);
      }

      parallel(array, each3).done(
        function (result) {
          assert.deepEqual([2, 1, 0], finishedOrder3);
          assert.equal(undefined, result[1]);
        }).fail(function (err, item, idx) {
          assert.equal('error', err);
          assert.equal(item, 3);
          assert.equal(idx, 1);
        });

      parallel([1, 2, 3, 4], function (item, idx, arr, callback) {
        if (item !== 3) {
          callback(null, item * 10);
        }
      })
        .done(function (result) {
          // this should never be called
          assert.equal(false, true);
        })
        .timeout(function (result) {
          assert.equal(-1, result.indexOf(30));
        }, 1);
      setTimeout(_done, 1800);
    });
  });

  describe('promise', function () {
    it('should convert async function to promise form with identical functionality', function () {
      var readFile = promise(fs.readFile);
      fs.readFile(__filename, function (err, data1) {
        if (err) throw err;
        readFile(__filename).when(function (err, data2) {
          if (err) throw err;
          assert.deepEqual(data1, data2);
        });
      });
    });
  });

  describe('defer', function () {
    it('should create defer form of the async function', function (done) {
      var emitter = new EventEmitter;
      var readFile = defer(fs.readFile, fs, emitter), finished = 0;
      var otherFn = defer(function (delay, callback) {
        setTimeout(function () {
          callback(null, 'fromOtherFn');
        }, delay);
      });
      fs.readFile(__filename, function (err, data1) {
        if (err) throw err;
        emitter.on('done', function () {
          assert.equal(finished, 1);
          finished = 2;
        });
        readFile(__filename)
          .then(function (data2) {
            assert.deepEqual(data1, data2);
          })
          .then(function (data2) {
            assert.deepEqual(data1, data2);
          })
          .and(function (defer, data2) {
            assert.deepEqual(data1, data2);
            defer.next(10);
          })
          .and(function (defer, data3) {
            assert.equal(data3, 10);
            return true;
          })
          .and(function (defer, data4) {
            otherFn(100).then(function (d) {
              assert.equal(data4, 10);
            }).defer(defer);
          })
          .and(function (defer, data5) {
            otherFn(100).and(function (d, d5) {
              assert.equal(d5, 'fromOtherFn');
              assert.equal(data5, 'fromOtherFn');
              d.next(30);
            }).callback(function (err, data6) {
                assert.equal(data6, 30);
                finished = 1;
                err ? defer.error(err) : defer.next(data6);
              });
          })
          .done(function () {
            // done is called after second `and` and after the `done` event
            assert.equal(finished, 2);
            done();
          });

        emitter.on('fail', function (err) {
          assert.equal('ENOENT', err.code);
        });
        readFile(__filename + '1').fail(function (err) {
          assert.equal('ENOENT', err.code);
        });
      });
    });

    it('should call deferred callback in order for `and`, `then` callbacks', function (done) {
      function asyncFn(x, callback) {
        setTimeout(function () {
          callback(null, x + 1);
        }, 1000);
      }

      var fn = defer(asyncFn);
      var then1 = 0;
      var then2 = 0;
      fn(10)
        .and(function (defer, result) {
          assert.equal(11, result);
          defer.next(result + 1);
        })
        .and(function (defer, result) {
          assert.equal(12, result);
          defer.next(result + 2);
        })
        .and(function (defer, result) {
          assert.equal(14, result);
          defer.next(14);
        })
        .then(function (result) {
          then1 = result * 2;
        })
        .then(function (result) {
          assert.equal(14, result);
          then2 = then1 * 2;
        })
        .and(function () {
          assert.equal(28, then1);
          assert.equal(56, then2);
          done();
        });
    });

    it('should be able to register many callbacks at once', function (done) {
      function asyncFn(x, callback) {
        setTimeout(function () {
          callback(null, x + 1);
        }, 1000);
      }

      var fn = defer(asyncFn);

      function fn1(defer, result) {
        assert.equal(11, result);
        defer.next(result + 1);
      }

      function fn2(defer, result) {
        assert.equal(12, result);
        defer.next(result + 2);
      }

      function fn3(result) {
        assert.equal(14, result);
      }

      function fn4(result) {
        assert.equal(14, result);
        done();
      }

      fn(10).and(fn1, fn2).then(fn3, fn4);
    });
  });

});
