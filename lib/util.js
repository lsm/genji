"use strict";
/**
 * Module dependencies
 */

var path = require('path');
var fs = require('fs');

/**
 * Module exports
 */

exports.extend = extend;
exports.toArray = toArray;
exports.byteLength = byteLength;
exports.expose = expose;
exports.delegate = delegate;
exports.Injector = Injector;
exports.Klass = Klass;

/**
 * Convert an array-like object to array (arguments etc.)
 *
 * @param obj
 * @return {Array}
 */

function toArray(obj) {
  var len = obj.length,
      arr = new Array(len);
  for (var i = 0; i < len; ++i) {
    arr[i] = obj[i];
  }
  return arr;
}

/**
 * Extend an object with given properties
 *
 * @param obj
 * @param props
 * @return {*}
 */

function extend(obj, props) {
  var propsObj = toArray(arguments);
  propsObj.shift();
  propsObj.forEach(function(props) {
    if (props) {
      Object.keys(props).forEach(function(key) {
        obj[key] = props[key];
      });
    }
  });
  return obj;
}

/**
 * Calculate byte length of string
 *
 * @param str
 * @return {Number}
 */

function byteLength(str) {
  if (!str) {
    return 0;
  }
  var matched = str.match(/[^\x00-\xff]/g);
  return (str.length + (!matched ? 0 : matched.length));
}

/**
 * Export sub modules under the module's directory
 *
 * @param module {Object} The global "module" inside each node.js source file context
 * @param subModules {String|Array} Name(s) of the sub-module you want to expose
 * @public
 */

function expose(module, subModules) {
  var modulePath = path.dirname(module.filename);
  var exports_ = module.exports;
  if (subModules) {
    if (!Array.isArray(subModules)) {
      subModules = [subModules];
    }
    subModules.forEach(function (sub) {
      var subName;
      var subPath;
      if (sub[0] === '/') {
        subPath = sub;
        sub = sub.split('/');
        sub = sub[sub.length - 1];
      } else {
        subName = sub;
        subPath = path.join(modulePath, subName);
      }
      subName = sub.split('.')[0];
      var _module = {};
      _module[subName] = require(subPath);
      extend(exports_, _module);
    });
  } else {
    subModules = fs.readdirSync(modulePath);
    if (subModules.length > 0) {
      subModules.forEach(function (sub) {
        var subPath = path.join(modulePath, sub);
        var stats = fs.statSync(subPath);
        if ((stats.isDirectory() && fs.existsSync(path.join(subPath, 'index.js'))) || (stats.isFile() && path.extname(subPath) === '.js')) {
          if (subPath !== module.filename) {
            expose(module, subPath);
          }
        }
      });
    }
  }
}

function delegate(delegatee, properties, delegator) {
  delegator = delegator || this;
  properties.forEach(function (name) {
    var delegateeName = name;
    var delegatorName = name;
    if (Array.isArray(name)) {
      delegateeName = name[0];
      delegatorName = name[1];
    }
    var property = delegatee[delegateeName];
    if (delegator[delegatorName]) {
      console.warn('Delegated property "%s" exists, overriding.', delegatorName);
    }
    if ('function' === typeof property) {
      delegator[delegatorName] = function () {
        var result = property.apply(delegatee, toArray(arguments));
        if (result === delegatee) {
          result = delegator;
        }
        return result;
      };
    } else {
      delegator[delegatorName] = property;
    }
  });
}

/* Thanks for Angular.js */
var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function Injector() {
  this.dependencies = {};
};

Injector.prototype = {

  regDependency: function (name, dependency) {
    if (this.dependencies.hasOwnProperty(name)) {
      console.log('Dependency %s exists, overidding.', name);
    }
    this.dependencies[name] = dependency;
  },

  getDependency: function (name) {
    return this.dependencies[name];
  },

  getDependencies: function (args, defaultValues) {
    var deps = this.dependencies;
    defaultValues = defaultValues || {};
    return args.map(function(dependencyName, idx) {
      return deps[dependencyName] || defaultValues[idx];
    });
  },

  mergeInjector: function (otherInjector) {
    this.dependencies = extend({}, otherInjector.dependencies, this.dependencies);
  },

  getFnArgs: function (fn) {
    return fn.toString().replace(STRIP_COMMENTS, '').match(FN_ARGS)[1].replace(/[\t\s\r\n]+/mg, '').split(',');
  },

  inject: function (fn) {
    var _fn = fn;
    var self = this;
    var fnArgs = this.getFnArgs(fn);
    fn = function () {
      var defaultArgs = toArray(arguments);
      var _args = (this.getDependencies ? this : (this.injector || self)).getDependencies(fnArgs, defaultArgs);
      _fn.apply(this, _args);
    };
    return fn;
  }
};

/**
 * Super lightweight javascript OO implementation.
 *
 * @param superClass {Function} The parent class which you want to inherit from.
 * @param subModule {Object} Instance properties of subclass.
 * @param [inherit] {Function} Optional customized inheriting function for changing the default inheriting behaviour.
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

  var _inherit = inherit ? inherit : function (prototype, subModule) {
    Object.keys(subModule).forEach(function (key) {
      prototype[key] = subModule[key];
    });
  };

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
