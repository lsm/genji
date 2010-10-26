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
            throw new Error('Chain named ' + name + ' not exists.');
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
    return function next(step, args, ctx) {
        step = step || 0;
        if (step >= array.length) {
            doneCallback && doneCallback();
            return;
        }
        callback.call(ctx, array[step], step++, array, function() {
            next(step, arguments.length > 0 ? arguments : args, ctx);
        }, args);
    }
}

/**
 * Simple function which can convert your async function to a promise and call as many times as you wish
 *
 * @param {Function} asyncFn Your original async function like `fs.readFile`
 * @param {Object} context Context you want to keep for the asyncFn (`this` inside your function scope)
 * @return {Function} Promise version of your function
 */
function promise(asyncFn, context) {
    return function() {
        // the callback handler registered by calling `then(callback)`
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

module.exports = {chain: chain, Chain: Chain, promise: promise};