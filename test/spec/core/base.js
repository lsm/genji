describe('Base', function() {
    var Base = require('genji/core/base').Base;
    var Class, ClassPlus, ClassPlusPlus, Class4
    , klass, klassPlus, klassPlusPlus, klass4;

    beforeEach(function() {
        Class = Base(function(name) {
            this.name = name;
        });

        ClassPlus = Class({
            init: function(name, age) {
                this._super(name+1);
                this.age = age;
            }
        });

        ClassPlusPlus = ClassPlus({
            getName: function() {
               return this.name;
            },
            getAge:  function() {
               return this.age;
            }
        });

        Class4 = ClassPlusPlus({
            init: function(name, age) {
                this._super(name, age);
            }
        });

        klass = new Class('class');
        klassPlus = new ClassPlus('classPlus', 18);
        klassPlusPlus = new ClassPlusPlus('classPlusPlus', 26);
        klass4 = new Class4('class4', 14);
    });

            

    describe('inheritance', function() {
        it('should be an instance of their respective class, the same for their constructor', function() {
            expect(klass.constructor).toBe(Class);
            expect(klass instanceof Class).toEqual(true);
            expect(klassPlus.constructor).toBe(ClassPlus);
            expect(klassPlus instanceof Class).toEqual(true);
            expect(klassPlus instanceof ClassPlus).toEqual(true);
            expect(klassPlusPlus.constructor).toBe(ClassPlusPlus);
            expect(klassPlusPlus instanceof Class).toEqual(true);
            expect(klassPlusPlus instanceof ClassPlus).toEqual(true);
            expect(klassPlusPlus instanceof ClassPlusPlus).toEqual(true);
        });
        it('should not affect parent class and instances', function() {
            expect(ClassPlus.prototype.getAge).toBeUndefined();
            expect(klassPlus.getName).toBeUndefined();
        });
    });

    describe('property and constructor', function() {
        it('should has properties setted in constructor', function() {
            expect(klass.name).toEqual('class');
            expect(klassPlus.age).toEqual(18);
        });
        it('should be able to set properties by calling parent\'s constructor', function() {
            expect(klassPlus.name).toEqual('classPlus1');
            expect(klass4.getAge()).toEqual(14);
            expect(klass4.getName()).toEqual('class41');
        });
        it('', function() {});
        it('should call parent\'s constructor if there\'s no `init` defined', function() {
            expect(klassPlusPlus.getName()).toEqual('classPlusPlus1');
            expect(klassPlusPlus.getAge()).toEqual(26);
        });
    });
});


describe('Class', function () {
    var Class = require('genji/core/base').Class;
    var MyClass, MyClassPlus, klass, klassPlus;

    beforeEach(function() {
        MyClass = Class({
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

        MyClassPlus = MyClass({
            setName: function(name) {
                this.name = name;
            },
            say: function() {
                return this._super() + ", while I'm the second one";
            }
        });

        klass = new MyClass('A class');
        klassPlus = new MyClassPlus('B class');
    });
    describe('inheritance', function() {
        it('should be an instance of their respective class, the same for their constructor', function() {
            expect(klass.constructor).toBe(MyClass);
            expect(klass instanceof MyClass).toEqual(true);
            expect(klassPlus.constructor).toBe(MyClassPlus);
            expect(klassPlus instanceof MyClass).toEqual(true);
            expect(klassPlus instanceof MyClassPlus).toEqual(true);
        });
        it('should not affect parent class and instances', function() {
            expect(MyClass.prototype.setName).toBeUndefined();
            expect(klass.setName).toBeUndefined();
        });
    });

    describe('defining properties', function() {
        it('should has methods', function() {
            expect(MyClass.prototype.hasOwnProperty('init')).toEqual(true);
            expect(MyClass.prototype.hasOwnProperty('getName')).toEqual(true);
            expect(MyClass.prototype.hasOwnProperty('say')).toEqual(true);
            expect(typeof klass.init).toEqual('function');
            expect(typeof klass.getName).toEqual('function');
            expect(typeof klass.say).toEqual('function');
        });

        it('should has properties setted by constructor of the class', function() {
            expect(klass.name).toEqual('A class');
            expect(klass.getName()).toEqual('A class');
            expect(klassPlus.getName()).toEqual('B class');
        });

    });
    
    describe('_super and override', function() {
        it('should be overrided', function() {
            expect(klassPlus.say()).toEqual("I'm the first one, while I'm the second one");
        });
    });
});
