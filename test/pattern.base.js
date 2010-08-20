var Base = require('genji/pattern/base');
var Class, ClassPlus, ClassPlusPlus, Class4
, klass, klassPlus, klassPlusPlus, klass4;

function setup() {
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
}

module.exports = {
    'test inherits': function(assert) {
        setup();
        assert.equal(klass.constructor, Class);
        assert.equal(klass instanceof Class, true);
        assert.equal(klassPlus.constructor, ClassPlus);
        assert.equal(klassPlus instanceof Class, true);
        assert.equal(klassPlus instanceof ClassPlus, true);
        assert.eql(klassPlusPlus.constructor, ClassPlusPlus);
        assert.equal(klassPlusPlus instanceof Class, true);
        assert.equal(klassPlusPlus instanceof ClassPlus, true);
        assert.equal(klassPlusPlus instanceof ClassPlusPlus, true);
        assert.isUndefined(ClassPlus.prototype.getAge);
        assert.isUndefined(klassPlus.getName);
    },

    'test constructor': function(assert) {
        assert.equal(klass.name, 'class');
        assert.equal(klassPlus.age, 18);
        assert.equal(klassPlus.name, 'classPlus1');
        assert.equal(klass4.getAge(), 14);
        assert.equal(klass4.getName(), 'class41');
        assert.equal(klassPlusPlus.getName(), 'classPlusPlus1');
        assert.equal(klassPlusPlus.getAge(), 26);
    },

    'test mixin - extend': function(assert) {
        ClassPlus.extend({
            hello: function() {
                return 'hello';
            }
        }, {
            world: function() {
                return 'world';
            }
        });
        assert.equal(ClassPlus.hello(), 'hello');
        assert.equal(ClassPlus.world(), 'world');
        assert.equal(ClassPlusPlus.hello, undefined);
        assert.equal(Class.hello, undefined);
        assert.equal(klassPlus.hello, undefined);

        setup();

        klassPlusPlus.extend({
            getEmail: function() {
                return this.email;
            },
            setEmail: function(email) {
                this.email = email;
            }
        });
        klassPlusPlus.setEmail('123@123.com');
        assert.equal(klassPlusPlus.getEmail(), '123@123.com');
        assert.equal(klassPlus.setEmail, undefined);
        assert.equal(klass4.setEmail, undefined);
        assert.equal(Class4.setEmail, undefined);
        assert.equal(ClassPlus.setEmail, undefined);
    }
}
