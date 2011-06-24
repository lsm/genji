var genji = require('genji');
var Base = genji.require('base');
var Class, ClassPlus, ClassPlusPlus, Class4
    , klass, klassPlus, klassPlusPlus, klass4;
var assert = require('assert');

function setup() {
  Class = Base(function(name) {
    this.name = name;
  });

  ClassPlus = Class({
    init: function(name, age) {
      this._super(name + 1);
      this.age = age;
    }
  });

  ClassPlusPlus = ClassPlus({
    getName: function() {
      return this.name;
    },
    getAge:  function() {
      return this.age;
    },
    include: [
      {getSchool: function() {
        return 'MIT'
      }}
    ],
    extend: [
      {getSchool: function() {
        return 'NYU'
      }}
    ]
  });

  Class4 = ClassPlusPlus({
    init: function(name, age) {
      this._super(name, age);
    },
    // instance method
    include: {
      setAge: function(age) {
        this.age = age;
      }
    },
    // static method
    extend: {
      getClassName: function() {
        return 'Class4';
      }
    }
  });

  klass = new Class('class');
  klassPlus = new ClassPlus('classPlus', 18);
  klassPlusPlus = new ClassPlusPlus('classPlusPlus', 26);
  klass4 = new Class4('class4', 14);
}

module.exports = {
  'test inherits': function() {
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

  'test constructor': function() {
    assert.equal(klass.name, 'class');
    assert.equal(klassPlus.age, 18);
    assert.equal(klassPlus.name, 'classPlus1');
    assert.equal(klass4.getAge(), 14);
    klass4.setAge(15);
    assert.equal(klass4.getAge(), 15);
    assert.equal(klass4.getName(), 'class41');
    assert.equal(klassPlusPlus.getName(), 'classPlusPlus1');
    assert.equal(klassPlusPlus.getAge(), 26);
  },

  'test mixin - extend': function() {
    ClassPlus.extend({
          hello: function() {
            return 'hello';
          }
        }, {
          world: function() {
            return 'world';
          }
        });
    // static functions
    assert.equal(ClassPlus.hello(), 'hello');
    assert.equal(ClassPlus.world(), 'world');
    assert.equal(ClassPlusPlus.hello, undefined);
    assert.equal(ClassPlusPlus.getSchool(), 'NYU');
    assert.equal(Class.hello, undefined);
    assert.equal(Class4.getClassName(), 'Class4');
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
    assert.equal(klassPlusPlus.getSchool(), 'MIT');
    assert.equal(klassPlus.setEmail, undefined);
    assert.equal(klass4.setEmail, undefined);
    assert.equal(Class4.setEmail, undefined);
    assert.equal(ClassPlus.setEmail, undefined);
  },

  'test convert module to class': function() {
    var Engine = Base({
      init: function(name) {
        this.name = name;
      },

      start: function() {
        return 'engine ' + this.name + ' started';
      }
    });
    var engine = new Engine('e90');
    assert.equal(engine instanceof Engine, true);
    assert.equal(engine.start(), 'engine e90 started');
  },

  'test extend class like module': function() {
    var Person = function(name) {
      this.name = name;
    }
    var Worker = function() {
      this.role = 'worker';
    }
    Worker.prototype.work = function() {
      return this.role + ' can work';
    }

    var WorkerClass = Base(Person, Worker);
    var worker = new WorkerClass('john');
    assert.equal(worker.name, 'john');
    assert.equal(worker.role, 'worker');
    assert.equal(worker.work(), 'worker can work');

    var Leader = function() {
      this.role = 'leader';
    }
    Leader.prototype.getRole = function() {
      return this.role;
    }
    WorkerClass.include(Leader); // `Leader` will be treated as a module
    var leadWorker = new WorkerClass('tom');
    assert.equal(leadWorker.getRole(), 'worker');
  },

  'test extending wrrong object': function() {
    try {
      Class.include('');
      assert.equal(1, 2); // should not be called
    } catch (e) {
      assert.equal(e.message, 'Type not accepted');
    }
  }
}