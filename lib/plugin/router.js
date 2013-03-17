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
   * @param [options]
   * @returns {Function}
   */

  attach: function (core, options) {
    options = options || {};
    var router = options.router || (new Router(options.routes, options.options));
    core.router = router;

    return function (req, res, go) {
      var self = this;
      router.route(req.method, req.url, this, options.notFound || function () {
        var error = {
          code: 404,
          message: 'Content not found: ' + req.url,
          core: core,
          context: self,
          request: req,
          response: res
        };
        self.emit('error', error);
      });
      go();
    }
  }
};