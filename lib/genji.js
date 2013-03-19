/**
 * The global Genji module
 */

/**
 * Exposes version of Genji
 *
 * @type {string}
 */

exports.version = exports.VERSION = '0.7.0';

/**
 * Exposes public apis and modules
 */

var util = require('./util');
var extend = util.extend;

/**
 * Extends frequently used submodules to the global Genji module
 */

extend(exports, util);
extend(exports, require('./base'));
extend(exports, require('./control'));
extend(exports, require('./core'));
extend(exports, require('./site'));
extend(exports, require('./router'));
extend(exports, {Model: require('./model').Model});
extend(exports, require('./app'));
extend(exports, {View: require('./view').View});

/**
 * Extends other submodules with module name as namesapce
 */

extend(exports, {auth: require('./auth')});
extend(exports, {cookie: require('./cookie')});
extend(exports, {crypto: require('./crypto')});
extend(exports, {mime: require('./mime')});
extend(exports, {view: require('./view')});

/**
 * Creates a Router instance
 *
 * @param [routes] {Array} Optional predefined routing definitions
 * @param [options] {Object} Optional router options which may contains:
 *   - contextClass Default context constructor class
 *   - urlRoot The default url prefix
 * @returns {exports.Router} The router instance
 */

exports.route = function route(routes, options) {
  options = options || {};
  return new exports.Router(routes, options);
};

/**
 * Creates a Site instance
 *
 * @returns {exports.Site}
 */

exports.site = function site() {
  return new exports.Site();
};