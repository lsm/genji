describe('Base', function() {
    var Base = require('genji/core').Base;
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
            },

            include: {
                setAge: function(age) {
                    this.age = age;
                }
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
        it('should call parent\'s constructor if there\'s no `init` defined', function() {
            expect(klassPlusPlus.getName()).toEqual('classPlusPlus1');
            expect(klassPlusPlus.getAge()).toEqual(26);
        });
    });

    describe('mixin - include', function() {
        it('should have the included functions and keep the prototype chain', function() {
            ClassPlusPlus.include({
                setName: function(value) {
                    this.name = value;
                }
            });
            expect(typeof klassPlusPlus.setName).toEqual('function');
            expect(typeof klass4.setName).toEqual('function');
            expect(typeof klass4.setAge).toEqual('function');
            expect(typeof klassPlus.setName).toEqual("undefined");
            expect(typeof ClassPlusPlus.setName).toEqual("undefined");
        });
    });
    describe('mixin - extend', function() {
        it("should have the extended static functions and dose not break the Class and prototype chain", function() {
            ClassPlus.extend({
                hello: function() {
                    return 'hello';
                }
            }, {
                world: function() {
                    return 'world';
                }
            });
            expect(ClassPlus.hello()).toEqual('hello');
            expect(ClassPlus.world()).toEqual('world');
            expect(ClassPlusPlus.hello).toEqual(undefined);
            expect(Class.hello).toEqual(undefined);
            expect(klassPlus.hello).toEqual(undefined);
        });

        it("should be able to extend the instance and dose not break the Class and prototype chain", function() {
            klassPlusPlus.extend({
                getEmail: function() {
                    return this.email;
                },
                setEmail: function(email) {
                    this.email = email;
                }
            });
            klassPlusPlus.setEmail('123@123.com');
            expect(klassPlusPlus.getEmail()).toEqual('123@123.com');
            expect(klassPlus.setEmail).toEqual(undefined);
            expect(klass4.setEmail).toEqual(undefined);
            expect(Class4.setEmail).toEqual(undefined);
            expect(ClassPlus.setEmail).toEqual(undefined);
        });

    });
});