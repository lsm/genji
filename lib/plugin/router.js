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
   * @param [options] {Object} Optional options for router plugin or instance of Router
   * @returns {Function}
   */

  attach: function (core, options) {
    var router;
    if (options instanceof Router) {
      router = options;
    } else {
      options = options || {};
      router = new Router(options);
    }
    core.router = router;

    return function (request, response, go) {
      var matched = router.route(request.method, request.url, this, function (request, response) {
        var notFound = options.notFound || function (request, response) {
          var error = {
            statusCode: 404,
            message: 'Content not found: ' + request.url
          };
          this.error(error);
        };
        notFound.call(this, request, response);
        go();
      });
      if (matched) {
        go();
      }
    };
  }
};