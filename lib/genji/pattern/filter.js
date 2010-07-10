var Base = require('../core/base').Base,
slice = Array.prototype.slice;

module.exports = Base({
    init: function() {
        this._filter = {};
    },

    add: function(type, func) {
        var prev = this.get(type), filter;
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

    get: function(type) {
        return this._filter[type];
    }
});
