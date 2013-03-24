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
