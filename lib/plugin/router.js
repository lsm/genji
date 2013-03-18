/**
 * Router plugin for working with middleware
 */

/**
 * Module dependencies.
 */

var Router = require('../router').Router;

/**
 * Module exports
 *
 * @type {{name: string, attach: Function}}
 * @public
 */

module.exports = {

  /**
   * Name of the plugin
   */

  name: 'Router',

  /**
   * Plugin setup function
   *
   * @param core {Object} Instance of Core class
   * @param [options] Optional options for router plugin
   * @returns {Function}
   */

  attach: function (core, options) {
    options = options || {};
    var router = options.router || (new Router(options.routes, options.options));
    core.router = router;

    return function (request, response, go) {
      var matched = router.route(request.method, request.url, this, function (context, request, response) {
        var notFound = options.notFound || function (context, request, response) {
          var error = {
            code: 404,
            message: 'Content not found: ' + request.url,
            core: core,
            context: context,
            request: request,
            response: response
          };
          core.emitter.emit('error', error);
        };
        notFound(context, request, response);
        go();
      });
      matched && go();
    }
  }
};