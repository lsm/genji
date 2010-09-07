var slice = Array.prototype.slice;

var Filter = function() {
    this._filter = {};
};

Filter.prototype = {
    addFilter: function(type, func) {
        var prev = this.getFilter(type), filter;
        if (typeof prev === 'function') {
            filter = function() {
                var me = this;
                prev.apply(function() {
                    func.apply(me, slice.call(arguments, 0));
                }, slice.call(arguments, 0));
            }
        } else {
            filter = func;
        }
        this._filter[type] = filter;
    },

    getFilter: function(type) {
        return this._filter[type];
    }
};

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
            fn.apply(this, args);
        });
        return function () {
            fnChain(0, arguments, this);
        }
    }
}

var chain = function(array, callback) {
    return function next(step, args, ctx) {
        step = step || 0;
        if (step >= array.length) return;
        callback.call(ctx, array[step], step++, array, function() {
            next(step, arguments.length > 0 ? arguments : args, ctx);
        }, args);
    }
};


module.exports = {Filter: Filter, chain: chain, Chain: Chain};