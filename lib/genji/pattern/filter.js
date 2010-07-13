var Base = require('../core').Base,
slice = Array.prototype.slice;

module.exports = Base(function() {
    this._filter = {};
}, {
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
});
