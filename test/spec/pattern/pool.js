describe('Testing Pool', function() {
    var Pool = require('genji/pattern/pool').Pool, pool;
    function fillPool(num, callback) {
        for (var i = 0; i < num; i++) {
            callback(i);
        }        
    }

    beforeEach(function() {
        pool = new Pool(fillPool, 5);
    });

    it("should fill the pool", function() {
        process.nextTick(function(){
            expect(pool._pool.length).toEqual(5);
            asyncSpecDone();
        });
        asyncSpecWait();
    });
    it("should pop '0'", function() {
        process.nextTick(function() {
            var x;
            pool.pop(function(i) {
                x = i;
            });
            expect(x).toEqual(0);
            pool.emit('back', x);
            asyncSpecDone();
        });
        asyncSpecWait();
    });
    it("should queue task", function() {
        process.nextTick(function() {
            for (var i = 0; i < 12; i++) {
                pool.pop(function() {});
            }
            expect(pool._queue.length).toEqual(7);
            asyncSpecDone();
        });
        asyncSpecWait();
    });
    it("should run the queued tasks after item is returned to the pool", function() {
        process.nextTick(function() {
            for (var i = 0; i < 12; i++) {
                pool.pop(function() {});
            }
            expect(pool._queue.length).toEqual(7);
            for (var j = 0; j < 3; j++) {
                pool.emit('back', j);
            }
            expect(pool._queue.length).toEqual(4);
            asyncSpecDone();
        });
        asyncSpecWait();
    });
});