/**
 * Cookie parsing/encoding utilities
 */

/**
 * Module dependencies
 */

var qs = require('querystring');
var escape = qs.escape;
var unescape = qs.unescape;

/**
 * Module exports
 *
 * @type {{parse: Function, stringify: Function, checkLength: Function}}
 */

module.exports = {

  /**
   * Parse a cookie string
   *
   * @param cookie {String} The cookie string being parsed
   * @param [name] {String} If the name is given, it returns cookie value for this name
   * @returns {Object|String}
   * @public
   */

  parse: function (cookie, name) {
    var cookies = {};
    if ('string' === typeof cookie) {
      // Copied from: [cookie-sessions](http://github.com/caolan/cookie-sessions/blob/master/lib/cookie-sessions.js)
      cookies = cookie.split(/\s*;\s*/g).map(
        function (x) {
          return x.split('=');
        }).reduce(function (a, x) {
          if (x[0] && x[1]) {
            a[unescape(x[0])] = unescape(x[1]);
          }
          return a;
        }, {});
    }
    return name ? cookies[name] : cookies;
  },

  /**
   * Encode cookie into string
   *
   * @param name {String} Cookie name
   * @param value {String} Cookie value
   * @param options {Object} Cookie options
   * @returns {string}
   * @public
   */

  stringify: function (name, value, options) {
    var cookie = name + "=" + escape(value);
    if (options) {
      if (options.expires) {
        cookie += "; expires=" + options.expires.toUTCString();
      }
      if (options.path) {
        cookie += "; path=" + options.path;
      }
      if (options.domain) {
        cookie += "; domain=" + options.domain;
      }
      if (options.secure) {
        cookie += "; secure=" + options.secure;
      }
      if (options.httponly) {
        cookie += "; httponly=" + options.httponly;
      }
      return cookie;
    }
  },

  /**
   * Check if the length of cookie string is conform to standard
   * @param cookieStr {String} Cookie string
   * @returns {boolean}
   * @private
   */

  checkLength: function (cookieStr) {
    return cookieStr.length <= 4096;
  }
};
