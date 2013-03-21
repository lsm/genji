/**
 * Javascript OO helpers
 */

/**
 * Module exports.
 */

exports.Base = Base;
exports.Klass = Klass;

/**
 * Feature rich javascript OO implementation
 * @param superCtor {Function|Object} Optional parent class's constructor or module object
 * @param subModule {Object} Instance properties of subclass
 * @return {Function}
 * inspired by:
 * http://rightjs.org/docs/class
 * http://ejohn.org/blog/simple-javascript-inheritance/
 */

function Base(superCtor, subModule) {
  var superClass;
  if (typeof superCtor !== 'function') {
    subModule = superCtor;
    superCtor = function () {
    };
  }
  if (typeof subModule === "function") {
    superClass = subModule;
    subModule = superClass.prototype;
  }
  var global = this;

  // constructor
  var ctor = function (module) {
    // determine if current function was called directly or with a new operator
    if (this !== global) {
      // function is called in order to initialize a instance
      if (superClass) {
        superClass.call(this);
      }
      this.init.apply(this, arguments);
    } else {
      // ctor is called in order to define a subclass
      return Base(ctor, module);
    }
  };
  ctor.include = function () {
    extend.call(ctor, ctor.prototype, arguments);
    return ctor;
  };

  ctor.extend = function () {
    return extend.call(ctor, ctor, arguments);
  };

  ctor = inherits(ctor, superCtor);
  if (!ctor.prototype.init) {
    ctor.prototype.init = superCtor;
  }
  // extending the prototype
  if (subModule) {
    extend.call(ctor, ctor.prototype, [subModule]);
  }

  ctor.prototype.extend = function () {
    return extend.call(ctor, this, arguments);
  };
  ctor.constructor = ctor; // Class.constrcutor == Class
  ctor.prototype.constructor = ctor; // instance.constructor == Class
  return ctor;
}

/**
 * Super lightweight javascript OO implementation
 *
 * @param superClass {Function} The parent class which you want to inherit from
 * @param subModule {Object} Instance properties of subclass
 * @param [inherit] {Function} Optional customized inheriting function for changing the default inheriting behaviour
 * @return {Function} The inherited subclass
 * @constructor
 */

function Klass(superClass, subModule, inherit) {
  var global = this;
  var superCtor = superClass;

  if ('function' === typeof subModule) {
    superCtor = subModule;
    subModule = subModule.prototype;
  }

  var _inherit = function (prototype, subModule) {
    Object.keys(subModule).forEach(function (key) {
      prototype[key] = subModule[key];
    });
  };

  if (inherit) {
    _inherit = inherit;
  }

  function constructor(subModule, inherit) {
    if (global !== this) {
      superCtor.apply(this, arguments);
      if ('function' === typeof this.init) {
        this.init.apply(this, arguments);
      }
    } else {
      return Klass(constructor, subModule, inherit || _inherit);
    }
  }

  var prototype = constructor.prototype;
  prototype.__proto__ = superClass.prototype;

  if (subModule) {
    _inherit(prototype, subModule);
  }

  return constructor;
}

/**
 * Helper functions for Base
 */

function makeSuper(name, fn, oldSuper) {
  return function () {
    var tmp = this._super;
    this._super = oldSuper;
    var ret = fn.apply(this, arguments);
    this._super = tmp;
    return ret;
  };
}

function extend(target, modules) {
  for (var i = 0, len = modules.length; i < len; i++) {
    var subModule = modules[i];
    switch (typeof subModule) {
      case 'function':
        // a constructor function
        subModule = subModule.prototype;
        break;
      case 'object':
        if (subModule === null) {
          continue;
        }
        // a module like object
        if (subModule.hasOwnProperty("include")) {
          if (Array.isArray(subModule.include)) {
            this.include.apply(null, subModule.include);
          } else {
            this.include(subModule.include);
          }
          delete subModule.include;
        }
        if (subModule.hasOwnProperty("extend")) {
          if (Array.isArray(subModule.extend)) {
            this.extend.apply(null, subModule.extend);
          } else {
            this.extend(subModule.extend);
          }
          delete subModule.extend;
        }
        break;
      default:
        throw new Error("Type not accepted");
    }

    for (var name in subModule) {
      if (typeof target[name] === "function" && typeof subModule[name] === "function") {
        var _super = target[name];
        target[name] = makeSuper(name, subModule[name], _super);
        continue;
      }
      target[name] = subModule[name];
    }
  }
  return target;
}

// copied from sys.inherits
function inherits(target, parent) {
  var tempCtor = function () {
  };
  tempCtor.prototype = parent.prototype;
  target.prototype = new tempCtor();
  return target;
}