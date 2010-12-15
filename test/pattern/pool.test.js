var Pool = require('genji/pattern/pool');
var assert = require('assert');


function feedPool(num, callback) {
    for (var i = 0; i < num; i++) {
        callback(i);
    }
}

module.exports = {
    'test Pool': function() {
        var pool =  new Pool(feedPool, 10);
        assert.equal(pool.length, 10);
        for (var i = 0; i < 10; i++) {
            pool.pop(function(item) {
                assert.equal(item, i);
                assert.equal(pool.length, 9 - i);
            });
        }
        // the pool is empty, tasks will be queued
        for (var i = 0; i < 10; i++) {
            pool.pop(function(item) {
                // function will not be called until something back to the pool
                throw new Error('Catch me when '+item+' back.');
            });
        }
        try {
            pool.emit('back', 'you');
            assert.equal(1, 'This should never be called');
        } catch (e) {
            assert.equal(e.message, 'Catch me when you back.');
            // still 9 tasks in the queue
            assert.equal(pool.queue, 9);
        }
    }
}