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

    get: function(name, fn) {
        if (!this._chain[name]) {
            throw new Error('Chain named ' + name + ' not exists.');
        }
        var chain = this._chain[name];
        return function next() {
            if (this.step == 0 ) this.next = next;
            if (this.step >= chain.length) return;
            var fn = chain[this.step++];
            fn.apply(this, arguments);
        }
    }
}

var chain = function(array, callback) {
    return function next(step, args, ctx) {
        step = step || 0;
        if (step >= array.length) return;
        callback.call(ctx, array[step], step++, array, function() {
            next.call(ctx, step, args);
        }, args);
    }
};


module.exports = {Filter: Filter, chain: chain, Chain: Chain};