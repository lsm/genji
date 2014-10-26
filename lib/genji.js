/**
 * The global Genji module
 */

/**
 * Exposes version of Genji
 *
 * @type {string}
 */

exports.version = exports.VERSION = '0.9.0';


/**
 * Module dependencies
 */

var util = require('./util');
var extend = util.extend;

/**
 * Exposes public apis and modules
 */

/**
 * Extends frequently used sub-modules to the global Genji object
 */

extend(exports, util);
extend(exports, require('./control'));
extend(exports, require('./core'));
extend(exports, require('./context'));
extend(exports, require('./router'));
extend(exports, {View: require('./view').View});

/**
 * Extends other sub-modules with module name as namespace
 */

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
 * Creates a Core instance with default middlewares and settings.
 * @param [options] {Object} Optional router options which may contains:
 *   - contextClass Default context constructor class
 *   - urlRoot The default url prefix
 *   - shouldInjectDependency Should inject deoendency for handler functions or not
 *   - injector The injector instance
 * @returns {exports.Core}
 */

exports.site = function site(routerOptions) {
  var core = new exports.Core();
  core.use('parser');
  core.use('router', extend({shouldInjectDependency: true, injector: core.injector}, routerOptions));
  return core;
};