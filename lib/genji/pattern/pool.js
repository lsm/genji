var EventEmitter = require('events').EventEmitter,
Base = require('./base');

/**
 * A first in first out pool and task queue, useful to build connection pool.
 */
module.exports = Base(EventEmitter, {
    /**
     * @constructor
     *
     * @param {Function} feedFn Function which pushs item into the pool, it tasks two arguments:
     * first is `size` as defined below, second is a callback function which you can be used to push your item into pool.
     * @param {Number} size Number of item you want to push in this pool
     * @return {Pool}
     */
    init: function(feedFn, size) {
        this._super();
        this._pool = [];
        this._queue = [];
        this._size = size;
        this._feedFn = feedFn;
        this.__defineGetter__('length', function() {return this._pool.length});
        this.__defineGetter__('queue', function() {return this._queue.length});
        var me = this;
        this.addListener('back', function(item) {
            if ( me._queue.length > 0) {
                me._queue.shift()(item);
            } else {
                me._pool.push(item);
            }
        });
        fillPool(size, function(item) {
            me.emit('back', item);
        });
    },

    /**
     * Pop a item to the callback. If the pool is empty, queue the task (callback).
     */
    pop: function(callback) {
        if (this._pool.length > 0) {
            callback(this._pool.shift());
        } else {
            this._queue.push(callback);
        }
    }
});

