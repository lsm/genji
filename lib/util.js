/**
 * @module util
 */
var path = require('path');
var fs = require('fs');

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
 * @param module
 * @param submodules
 * @return void
 */
function expose(module, submodules) {
  var modulePath = path.dirname(module.filename);
  var exports_ = module.exports;
  if (submodules) {
    Array.isArray(submodules) || (submodules = [submodules]);
    submodules.forEach(function (sub) {
      extend(exports_, require(path.join(modulePath, sub)));
    });
  } else {
    submodules = fs.readdirSync(modulePath);
    if (submodules.length > 0) {
      submodules.forEach(function (sub) {
        var subPath = path.join(modulePath, sub);
        var stats = fs.statSync(subPath);
        if ((stats.isDirectory() && fs.existsSync(path.join(subPath, 'index.js')))
          || (stats.isFile() && path.extname(subPath) === '.js')) {
          subPath === module.filename || extend(exports_, require(subPath));
        }
      });
    }
  }
}

exports.extend = extend;
exports.toArray = toArray;
exports.byteLength = byteLength;
exports.expose = expose;