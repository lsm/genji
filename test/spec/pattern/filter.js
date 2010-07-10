describe('Testing genji.pattern.Filter', function() {
    var Filter = require('genji/pattern/filter'), filter;
    
    function addOne(x) {
        this(x+1);
    }
    function multiplyFive(x) {
        this(x*5);
    }

    beforeEach(function() {
        filter = new Filter;
    });

    it("calls functions in order (FIFO)", function() {
        var x;
        filter.add('test', addOne);
        filter.add('test', multiplyFive);
        filter.add('test', addOne);
        filter.add('test', function(result) {
            x = result;
            // stop here if we don't call `this`
        });
        filter.add('test', function(result) {
            x = result + 1;
        });
        filter.get('test')(3);
        expect(x).toEqual(21);
    });
});