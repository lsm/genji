/**
 * Useful stuff for controlling javascript exection flow
 */

/**
 * Module dependencies
 */
var slice = Array.prototype.slice;


var Chain = function() {
    this._chain = {};
}

Chain.prototype = {
    add: function(name, fn) {
        if (!this._chain[name]) this._chain[name] = [];
        this._chain[name].push(fn);
    },

    get: function(name) {
        if (!this._chain[name]) {
            return undefined;
        }
        var fnChain = chain(this._chain[name], function(fn, idx, fnChain, next, args) {
            this.next = next;
            fn.apply(this, args) && next();
        });
        return function () {
            fnChain(0, arguments, this);
        }
    }
}

function chain(array, callback, doneCallback) {
    var length;
    if (!Array.isArray(array)) {
        if (isFinite(array)) {
            // can be parsed as a number,
            // this is useful if you want to call one function many times in serial order
            length = parseInt(array);
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
            next(step, arguments.length > 0 ? arguments : args, ctx);
        }, args);
    }
}

function parallel(array, callback, doneCallback) {
    var count = 0, len = array.length, result = [], done = function(res, idx, finish) {
        count++;
        result[idx] = res;
        if (finish || count === len) {
            doneCallback(result);
            count = len;
        }
    };
    array.forEach(function(item, idx, arr) {
        if (count < len) {
            callback(item, idx, arr, done);
        }
    });
}

/**
 * Simple function which can convert your async function to a promise and call as many times as you wish
 *
 * @param {Function} asyncFn Your original async function like `fs.readFile`
 * @param {Object} context Context you want to keep for the asyncFn (`this` inside your function scope)
 * @return {Function} Promise version of your function,
 * which you can register the callback functions by calling `then(callback)` of the returned object
 *
 */
function promise(asyncFn, context) {
    return function() {
        // the callback handler(s) registered by calling `then(callback)`
        var callback;
        // we assume latest argument of the original function is its callback
        // and you should omitted this argument for this promised version of your function
        var args = slice.call(arguments, 0);
        args.push(function() {
            callback && callback.apply(context, arguments);
        });
        // call the original async function with given context in next tick
        // to make sure the `then` function set the callback first
        process.nextTick(function() {
            asyncFn.apply(context, args);
        });
        return {
            then: function(handleFunc) {
                // register the callback function
                callback = handleFunc;
            }
        }
    }
}

/**
 * This an extended version of privous `promise` function with error handling facility
 * @param {Function} asyncFn Your original async function like `fs.readFile`
 * @param {Object} context Context you want to keep for the asyncFn (`this` inside your function scope)
 * @return {Function} Promise version of your function,
 * which you can register the callback functions by calling `then(callback)` of the returned object
 * and set the error handling function by calling `fail(errback)` respectively
 */
function deferred(asyncFn, context) {
    return function() {
        // the callback handler(s) registered by calling `then(callback)`
        var callback = [], errback;
        // we assume latest argument of the original function is its callback
        // and you should omitted this argument for this promised version of your function
        var args = slice.call(arguments, 0);
        args.push(function(err) {
            // this assume that, the first argument of the callback is an error object if error occurs, otherwise should be `null`
            if (!err) {
                if (callback.length > 0){
                    // since there is no `err`, remove it from the arguments
                    // this can help you separate your error handling logic from business logic
                    // and make the error handling part reusable
                    var theArgs = slice.call(arguments, 1);
                    callback.forEach(function(fn) {
                        fn.apply(context, theArgs);
                    });
                }
            } else {
                if (errback) {
                    // if we have error handler then use it
                    errback.call(context, err);
                } else {
                    // otherwise throw the exception
                    throw err;
                }
            }
        });
        // call the original async function with given context in next tick
        // to make sure the `then`/`fail` function set the callback first
        process.nextTick(function() {
            asyncFn.apply(context, args);
        });
        return {
            then: function(handleFunc) {
                // register the callback function
                callback.push(handleFunc);
                return this;
            },
            fail: function(errorFunc) {
                errback = errorFunc;
            }
        };
    }
}


module.exports = {
    chain: chain,
    parallel: parallel,
    Chain: Chain,
    promise: promise,
    deferred: deferred
};