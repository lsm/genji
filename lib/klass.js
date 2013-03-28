/**
 * Javascript OO helpers
 */

/**
 * Module exports.
 */

exports.Klass = Klass;

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
