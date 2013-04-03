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
      var urlObj = parseUrl(request.url);
      if (urlObj.query) {
        this.query = parseQuerystring(urlObj.query);
      }

      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
        request.setEncoding(options.encoding);
        var contentLength = parseInt(request.headers['content-length'], 10);

        if (isNaN(contentLength) || contentLength > options.maxIncomingSize) {
          // not a vaild request
          request.removeAllListeners();
          response.writeHead(413, {'Connection': 'close'});
          response.end();
          return;
        }

        var buff = '';
        request.on("data", function (chunk) {
          buff += chunk;
        });

        var contentType = request.headers['content-type'];
        request.on("end", function () {
          context.data = buff;
          if (contentType === 'application/x-www-form-urlencoded') {
            context.param = parseQuerystring(buff);
          } else if (/json|javascript/.test(contentType)) {
            try {
              context.json = JSON.parse(buff);
            } catch (e) {
            }
          }
          go();
        });
      } else {
        go();
      }
    };
  }
};