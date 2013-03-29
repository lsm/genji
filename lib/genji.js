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
 * Extends frequently used sub-modules to the global Genji module
 */

extend(exports, util);
extend(exports, require('./klass'));
extend(exports, require('./control'));
extend(exports, require('./core'));
extend(exports, require('./context'));
extend(exports, require('./site'));
extend(exports, require('./router'));
extend(exports, require('./model'));
extend(exports, require('./app'));
extend(exports, {View: require('./view').View});

/**
 * Extends other sub-modules with module name as namespace
 */

extend(exports, {auth: require('./auth')});
extend(exports, {cookie: require('./cookie')});
extend(exports, {crypto: require('./crypto')});
extend(exports, {view: require('./view')});
extend(exports, {plugin: require('./plugin')});

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