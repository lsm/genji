/**
 * Useful stuff for controlling javascript exection flow
 */

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

function chain(array, callback) {
    return function next(step, args, ctx) {
        step = step || 0;
        if (step >= array.length) return;
        callback.call(ctx, array[step], step++, array, function() {
            next(step, arguments.length > 0 ? arguments : args, ctx);
        }, args);
    }
}

module.exports = {chain: chain, Chain: Chain};