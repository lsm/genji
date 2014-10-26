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
exports.Injector = Injector;

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


var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;

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
    return fn.toString().match(FN_ARGS)[1].replace(/\t*\s*\r*\n*/mg, '').split(',');
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
  },

  reflect: function (reflectee, properties, reflector) {
    reflector = reflector || this;
    properties.forEach(function (name) {
      var reflecteeName = name;
      var reflectorName = name;
      if (Array.isArray(name)) {
        reflecteeName = name[0];
        reflectorName = name[1];
      }
      var property = reflectee[reflecteeName];
      if (reflector[reflectorName]) {
        console.warn('Reflected property "%s" exists, overriding.', reflectorName);
      }
      if ('function' === typeof property) {
        reflector[reflectorName] = function () {
          var result = property.apply(reflectee, toArray(arguments));
          if (result === reflectee) {
            result = reflector;
          }
          return result;
        };
      } else {
        reflector[reflectorName] = property;
      }
    });
  },
};
