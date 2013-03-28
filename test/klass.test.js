var genji = require('../index');
var Klass = genji.Klass;
var assert = require('assert');

describe('Klass', function () {
  it('should inherits', function () {
    var Class = Klass(function (name) {
      this.name = name;
    }, {
      getName: function () {
        return this.name;
      }
    });

    var Subclass = Class({
      getName: function () {
        return 'Subclass: ' + this.name;
      },

      getKey: function () {
        return 'Subclass.getKey';
      }
    });

    var Class2 = Class(function (name) {
      this.name = 'Class2:' + name;
    });

    var Class3 = Class({
      getAge: function () {
        return 18;
      }
    });

    var cls = new Class('john');
    var cls2 = new Class2('john');
    var subclass = new Subclass('mike');

    assert.equal(false, cls instanceof Klass);
    assert.equal(true, cls instanceof Class);
    assert.equal('john', cls.getName());
    assert.equal(undefined, cls.getKey);
    assert.equal(undefined, cls.getAge);

    assert.equal(false, cls2 instanceof Klass);
    assert.equal(true, cls2 instanceof Class);
    assert.equal(true, cls2 instanceof Class2);
    assert.equal('Class2:john', cls2.getName());
    assert.equal(undefined, cls2.getKey);
    assert.equal(undefined, cls2.getAge);

    assert.equal(false, subclass instanceof Klass);
    assert.equal(true, subclass instanceof Class);
    assert.equal(true, subclass instanceof Subclass);
    assert.equal('Subclass: mike', subclass.getName());

    assert.equal(undefined, Class3.prototype.getKey);
  });
});