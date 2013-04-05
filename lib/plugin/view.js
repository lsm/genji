/**
 * View module plugin extends context with template rendering functions
 */

/**
 * Module dependencies.
 */

var View = require('../view').View;

/**
 * Module exports
 *
 * @type {{name: String, module: Object}}
 * @public
 */

module.exports = {

  /**
   * Name of the plugin
   */

  name: "View",

  attach: function (core, options) {
    if (options instanceof View) {
      core.view = options;
    } else {
      core.view = new View(options.engine, options);
    }
  },

  /**
   * View module object
   *
   * @public
   */

  module: {

    /**
     * Render a template/layout with given view context data
     *
     * @param [path] {String} Path or name of the template file
     * @param [ctx] {Object} Data for rendering template
     * @param [callback] {function} Callback function for handling result, default is to send out result as html text
     */

    render: function (path, ctx, callback) {
      if ('string' !== typeof path) {
        callback = ctx;
        ctx = path;
        path = this.viewPath;
      }
      var self = this;
      if ('function' !== typeof callback) {
        callback = function (err, html) {
          if (err) {
            self.error({error: err, statusCode: 503, message: 'Failed to render file', context: self});
            return;
          }
          self.sendHTML(html);
        };
      }
      this.view.renderFile(path, ctx || {}, callback);
    }
  }
};