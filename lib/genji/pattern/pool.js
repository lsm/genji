var EventEmitter = require('events').EventEmitter,
Base = require('./base');

/**
 * A first in first out pool and task queue, useful to build connection pool.
 */
module.exports = Base(EventEmitter, {
    init: function(fillPool, size) {
        this._super();
        this._pool = [];
        this._queue = [];
        this._size = size;
        this._fill = fillPool;
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

