var Base = require('../core').Base;

module.exports = Base(function() {
    this._cache = {};
}, {
    set: function(key, value) {
        this._cache[key] = value;
    },

    get: function(key) {
        return this._cache[key];
    },

    has: function(key) {
        return this._cache.hasOwnProperty(key);
    },

    purge: function(key) {
        if (key) {
            delete this._cache[key];
        } else {
            this._cache = {};
        }
    }
});