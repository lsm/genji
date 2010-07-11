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
        filter.addFilter('test', addOne);
        filter.addFilter('test', multiplyFive);
        filter.addFilter('test', addOne);
        filter.addFilter('test', function(result) {
            x = result;
            // stop here if we don't call `this`
        });
        filter.addFilter('test', function(result) {
            // this func will never be called
            x = result + 1;
        });
        filter.getFilter('test')(3);
        expect(x).toEqual(21);
    });
});