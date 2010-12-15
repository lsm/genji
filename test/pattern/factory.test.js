var Factory = require('genji/pattern/factory');
var assert = require('assert');


module.exports = {
    'test Factory#register': function() {
        var defs = [['arr1', function(item) {return new Array(item)}, ['test'], true]];
        var factory = new Factory(defs);
        // singleton
        assert.eql(factory.arr1 === factory.arr1, true);
        assert.eql(factory.arr1, ['test']);
        factory.register('arr2', function(item) {return new Array(item)}, ['test']);
        // two different instances
        assert.equal(factory.arr2 === factory.arr2, false);
        assert.eql(factory.arr2, ['test']);
    },

    'test Factory#regCreator': function() {
        var factory = new Factory();
        factory.regCreator('RegExp', function(rule) {return new RegExp(rule)});
        factory.RegExp('matchNumber', ['[0-9]*'], true);
        assert.equal(factory.matchNumber(1)[0], '1');
        assert.equal(factory.matchNumber === factory.matchNumber, true);
        factory.RegExp('matchAtoZ', ['[A-Z]*']);
        assert.equal(factory.matchAtoZ('X')[0], 'X');
        assert.equal(factory.matchAtoZ === factory.matchAtoZ, false);
    }
}