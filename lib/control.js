/**
 * Useful stuff for controlling javascript exection flow
 */

/**
 * Module dependencies
 */
var toArray = require('./util').toArray;

var Chain = function() {
  this._chain = {};
};

Chain.prototype = {
  add: function(name, fn) {
    if (!this._chain[name]) this._chain[name] = [];
    this._chain[name].push(fn);
  },

  get: function(name) {
    if (!this._chain[name]) {
      return;
    }
    var fnChain = chain(this._chain[name], function(fn, idx, fnChain, next, args) {
      this.next = next;
      fn.apply(this, args) && next();
    });
    return function () {
      fnChain(0, toArray(arguments), this);
    };
  }
};

function chain(array, callback, doneCallback) {
  var length;
  if (!Array.isArray(array)) {
    if (isFinite(array)) {
      // can be parsed as a number,
      // this is useful if you want to call one function many times in serial order
      length = parseInt(array, 10);
    } else {
      throw new Error('`array` should be either `Array` or `Number`, `' + typeof array + '` got.');
    }
  } else {
    length = array.length;
  }
  return function next(step, args, ctx) {
    step = step || 0;
    if (step >= length) {
      doneCallback && doneCallback();
      return;
    }
    callback.call(ctx, array[step], step++, array, function() {
      next(step, arguments.length > 0 ? toArray(arguments) : args, ctx);
    }, args);
  };
}

/**
 * Executes async function `callback` for data sets `array` in parallel
 * @param array {Array}
 * @param callback {Function}
 * @param doneCallback {Function}
 * @param context {Object}
 */
function parallel(array, callback, doneCallback, context) {
  var count = 0, len = array.length, result = [];
  var failCallback;
  var timer, timeoutSeconds, timeoutCallback;
  process.nextTick(function() {
    array.forEach(function(item, idx, arr) {
      callback.call(context, item, idx, arr, function(err, res) {
        ++count;
        if (timer && count === len) clearTimeout(timer);
        if (err) {
          if (failCallback) {
            failCallback.call(context, err, item, idx);
          } else {
            console.trace('Please set error handling function with `.fail`');
            throw err;
          }
        } else {
          result[idx] = res;
        }
        if (count === len) {
          doneCallback && doneCallback.call(context, result);
        }
      });
    });
    if (timeoutSeconds) {
      timer = setTimeout(function() {
        timeoutCallback.call(context, result);
      }, timeoutSeconds*1000);
    }
  });
  var ret = {
    done: function(callback) {
      doneCallback = callback;
      return ret;
    },
    fail: function(callback) {
      failCallback = callback;
      return ret;
    },
    timeout: function(callback, timeoutInSeconds) {
      timeoutSeconds = timeoutInSeconds;
      timeoutCallback = callback;
    }
  };
  return ret;
}

/**
 * Simple function which can convert your async function to promise style and call as many times as you wish
 *
 * @param {Function} asyncFn Your original async function like `fs.readFile`
 * @param {Object} context Context you want to keep for the asyncFn (`this` inside your function scope)
 * @return {Function} Promise version of your function,
 * which you can register the callback functions by calling `then(callback)` of the returned object
 *
 */
function promise(asyncFn, context) {
  return function() {
    // the callback registered by calling `when(callback)`
    var callback;
    // we assume last argument of the original function is its callback
    // and you should omit this argument for the promised function generated
    var args = toArray(arguments);
    args.push(function() {
      callback && callback.apply(context, arguments);
    });
    // call the original async function with given context in next tick
    // to make sure the `when` function set the callback first
    process.nextTick(function() {
      asyncFn.apply(context, args);
    });
    return {
      when: function(handleFunc) {
        // register the callback function
        callback = handleFunc;
      }
    };
  };
}

/**
 * This an extended version of previous `promise` function with error handling and flow control facilities
 * @param {Function} asyncFn Your original async function like `fs.readFile`
 * @param {Object} context Context you want to keep for the asyncFn (`this` inside your function scope)
 * @return {Function} Deferred version of your function,
 * which you can register the callback functions by calling `then(callback)` of the returned object
 * and set the error handling function by calling `fail(errback)` respectively
 */
function defer(asyncFn, context) {
  return function() {
    // the callback handler(s) registered by calling `then(callback)`
    var thenCallbacks = [], failCallbacks = [], andCallbacks = [], doneCallback;
    // we assume last argument of the original function is its callback
    // and you should omit this argument for the deferred function generated
    var args = toArray(arguments);
    args.push(function(err) {
      // this assume that, the first argument of the callback is an error object if error occurs, otherwise should be `null`
      if (!err) {
        var theArgs = toArray(arguments);
        // since there is no `err`, remove it from the arguments
        // this can help you separate your error handling logic from business logic
        // and make the error handling part reusable
        theArgs.shift();
        if (thenCallbacks.length > 0) {
          // call the `then` stack
          thenCallbacks.forEach(function(fn) {
            fn.apply(context, theArgs);
          });
        }
        if (andCallbacks.length > 0) {
          // call the `and` stack
          chain(andCallbacks, function(fn, idx, fnChain, next, chainArgs) {
            chainArgs.unshift({next: next, error: errback_});
            if (fn.apply(this, chainArgs)) {
              chainArgs.shift();
              next.apply(null, chainArgs);
            }
          }, doneCallback)(0, theArgs, context);
        }
      } else {
        errback_(err);
      }
      // define an error callback so that we can call it in the `and` chain
      function errback_(err) {
        if (failCallbacks.length > 0) {
          // if we have error handler then use it
          failCallbacks.forEach(function(fn) {
            fn.call(context, err);
          });
        } else {
          // otherwise throw the exception
          console.trace('Please set error handling function with `.fail`');
          throw err;
        }
      }
    });
    // call the original async function with given context in next tick
    // to make sure the `then`,`and`,`done`,`fail` function set the callback first
    process.nextTick(function() {
      asyncFn.apply(context, args);
    });
    var ret = {
      then: function() {
        var fns = toArray(arguments);
        if (andCallbacks.length > 0) {
          // put at the tail of `and` callbacks
          var fn = function() {
            var args = toArray(arguments);
            args.shift(); // shift the `defer` object
            fns.forEach(function(f) {
              f.apply(this, args);
            }, this);
            return true;
          };
          andCallbacks.push(fn);
        } else {
          // register the callback function in parallel
          thenCallbacks = thenCallbacks.concat(fns);
        }
        return ret;
      },
      and: function() {
        andCallbacks = andCallbacks.concat(toArray(arguments));
        return ret;
      },
      done: function(fn) {
        doneCallback = fn;
        return ret;
      },
      fail: function(errorFunc, replace) {
        replace ? failCallbacks = [errorFunc] : failCallbacks.push(errorFunc);
        return ret;
      }
    };
    return ret;
  };
}


module.exports = {
  chain: chain,
  parallel: parallel,
  Chain: Chain,
  promise: promise,
  defer: defer
};