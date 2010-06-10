var Base = require('genji/core/base').Base;

var Class = Base({
    init: function(name) {
        this.name = name;
    },

    getName: function() {
        return this.name;
    },

    say: function() {
        return "I'm the first one";
    }
});

var ClassPlus = Class({
    setName: function(name) {
        this.name = name;
    },

    say: function() {
        return this._super() + ", while I'm the second one";
    }
});

var klass = new Class('A class');
var klassPlus = new ClassPlus('B class');

describe('Base', function () {
    describe('inheritance', function() {
        it('should be an instance of their respective class, the same for their constructor', function() {
            expect(klass.constructor).toBe(Class);
            expect(klass instanceof Class).toEqual(true);
            expect(klassPlus.constructor).toBe(ClassPlus);
            expect(klassPlus instanceof Class).toEqual(true);
            expect(klassPlus instanceof ClassPlus).toEqual(true);
        });
    });

    describe('defining properties', function() {
        it('should has methods', function() {
            expect(Class.prototype.hasOwnProperty('init')).toEqual(true);
            expect(Class.prototype.hasOwnProperty('getName')).toEqual(true);
            expect(Class.prototype.hasOwnProperty('say')).toEqual(true);
            expect(typeof klass.init).toEqual('function');
            expect(typeof klass.getName).toEqual('function');
            expect(typeof klass.say).toEqual('function');
        });

        it('should be called as constructor of the class', function() {
            expect(klass.name).toEqual('A class');
            expect(klass.getName()).toEqual('A class');
            expect(klassPlus.getName()).toEqual('B class');
        });

        it('should not affect parent class and instances', function() {
            expect(Class.prototype.setName).toBeUndefined();
            expect(klass.setName).toBeUndefined();
        });
    });
    
    describe('_super and override', function() {
        it('should be overrided', function() {
            expect(klassPlus.say()).toEqual("I'm the first one, while I'm the second one");
        });
    });
});
