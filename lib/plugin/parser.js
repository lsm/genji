/**
 * Simple parser for url query and post/put parameters.
 */

/**
 * Module dependencies.
 */

var parseQuerystring = require('querystring').parse;
var parseUrl = require('url').parse;

/**
 * Module exports.
 *
 * @type {{name: string, attach: Function}}
 * @public
 */

module.exports = {

  /**
   * Name of the plugin.
   */

  name: "Parser",

  /**
   * Setup function, call once during the middleware setup process
   *
   * @param core {Object} Instance of Core class
   * @param [options] {Object} middleware specific settings
   * @return {Function} Function will be called for each new request
   * @public
   */

  attach: function (core, options) {
    options = options || {};
    options.encoding = options.encoding || 'utf8';
    options.maxIncomingSize = options.maxIncomingSize || 256 * 1024;

    return function (request, response, go) {
      var context = this;

      if (request.method === 'POST' || request.method === 'PUT') {
        request.setEncoding(options.encoding);
        var contentLength = parseInt(request.headers['content-length'], 10);

        if (isNaN(contentLength) || contentLength > options.maxIncomingSize) {
          // not a vaild request
          request.removeAllListeners();
          request.connection.destroy();
          go();
          return;
        }

        var buff = '';
        request.on("data", function (chunk) {
          buff += chunk;
          if (Buffer.byteLength(buff, options.encoding) > options.maxIncomingSize) {
            request.removeAllListeners();
            request.connection.destroy();
          }
        });

        request.on("end", function () {
          if (context.listeners('data').length > 0) {
            context.emit('data', buff);
          }
          if (context.listeners('param').length > 0) {
            var param = parseQuerystring(buff);
            context.emit('param', param, buff);
          } else if (context.listeners('json').length > 0) {
            try {
              var json = JSON.parse(buff);
              context.emit('json', json, buff);
            } catch (e) {
              context.emit('json', null, buff, e);
            }
          }
        });
      }

      this.query = {};
      var urlObj = parseUrl(request.url);
      if (urlObj.query) {
        this.query = parseQuerystring(urlObj.query);
      }
      go();
    };
  }
};