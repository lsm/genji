/**
 * Cookie module plugin for context
 */

/**
 * Module dependencies.
 */

var cookie = require('../cookie');

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

  name: "Cookie",

  /**
   * Cookie module object
   *
   * @public
   */

  module: {

    /**
     * Set cookie to response header
     *
     * @param name {String} Name of the cookie
     * @param value {*} Value of the cookie
     * @param options {Object} Options of the cookie
     * @public
     */

    setCookie: function (name, value, options) {
      var cookieString = cookie.stringify(name, value, options);
      var cookies = this.getHeader('Set-Cookie');
      if (!Array.isArray(cookies)) {
        cookies = [];
      }
      cookies.push(cookieString);
      this.setHeader('Set-Cookie', cookies);
    },

    /**
     * Get request cookie value
     *
     * @param name {String} Name of the cookie
     * @returns {*} Value of the cookie if found
     * @public
     */

    getCookie: function (name) {
      if (!this.request.headers.cookie) {
        return null;
      }
      if (!this.cookies) { // request cookie will be parsed only one time
        this.cookies = cookie.parse(this.request.headers.cookie);
      }
      return this.cookies[name];
    },

    /**
     * Set a clear cookie to response header
     *
     * @param name {String} Name of the cookie need to be cleared
     * @param options {Object} Options of the cookie
     */

    clearCookie: function (name, options) {
      options = options || {};
      options.expires = new Date(0);
      this.setCookie(name, "", options);
    }
  }
};