
describe('ExampleSuite', function () {
  it('should have a passing test', function() {
      expect(true).toEqual(true);
  });

  describe('Nested Describe', function () {
     it('should also have a passing test', function () {
        expect(true).toEqual(true);
     });
  });
});


var Base = require("../lib/genji/core/base").Base,
assert = require("assert");

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

var Extended = Class({
	setName: function(name) {
		this.name = name;
	},
	
	say: function() {
		return this._super() + ", while I'm the second one";
	}
});

var Module = {
	send: function(message) {
		return message;
	}
};

var Module2 = {
	add: function(a, b) {
		return a + b;
	}
};

var Module3 = {
	minus: function(a, b) {
		return a - b;
	}
};

// test basic inheritance, constructor (init)
var test1 = function(instance, value) {
	assert.equal(instance.name, value);
	assert.equal(instance.getName(), value);
}

var class_1 = new Class("class");
test1(class_1, "class");

var class_2 = new Extended("extended");
test1(class_2, "extended");

class_2.setName("extended1");

assert.equal(class_2.getName(), "extended1");
assert.equal(typeof class_1.setName, "undefined");

// test _super
assert.equal(class_1.say(), "I'm the first one");
assert.equal(class_2.say(), "I'm the first one, while I'm the second one");

// test extend and include
class_2.extend(Module);

assert.equal(class_2.send("hello"), "hello");
assert.equal(typeof Extended.prototype.send, "undefined");
assert.equal(typeof Extended.send, "undefined");
assert.equal(typeof Class.send, "undefined");
assert.equal(typeof Class.prototype.send, "undefined");
assert.equal(typeof class_1.send, "undefined");

Extended.include(Module);

assert.equal(typeof Extended.prototype.send, "function");
assert.equal(typeof Extended.send, "undefined");

Extended.extend(Module);

assert.equal(typeof Extended.send, "function");

var Extended = Class({
	include: [Module, Module2],
	extend: Module3
});

var class_3 = new Extended("extended2");
test1(class_3, "extended2");
assert.equal(typeof Extended.send, "undefined");
assert.equal(typeof Extended.add, "undefined");
assert.equal(Extended.minus(3, 2), 1);
assert.equal(typeof Extended.prototype.minus, "undefined");
assert.equal(class_3.send("hello"), "hello");
assert.equal(class_3.add(1, 2), 3);