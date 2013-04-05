/**
 * Plugin for decrypting and verifying secure cookie
 */

/**
 * Module dependencies
 */

var c = require('../crypto');
var cipher = c.cipher;
var decipher = c.decipher;
var auth = require('../auth');
var cookieHelper = require('../cookie');
var parse = cookieHelper.parse;
var stringify = cookieHelper.stringify;
var extend = require('../util').extend;

/**
 * Module exports
 *
 * @type {{name: string, attach: Function}}
 */

module.exports = {

  /**
   * Name of the plugin
   */

  name: 'SecureCookie',

  /**
   * Plugin setup function
   * @param core {Object} Instance object of Core
   * @param options {Object} Plugin options:
   *   - secureKey {String} Key use to encrypt the signed cookie
   *   - serverKey {String} Hmac key use to sign the cookie
   *   - cookieName {String} Name of the cookie
   *   - [cookiePath] {String} Path of the cookie
   *   - [cookieDomain] {String} Domain of the cookie
   * @returns {Function}
   */

  attach: function (core, options) {
    var secureKey = options.secureKey;
    var cookieName = options.cookieName;
    var cookiePath = options.cookiePath;
    var cookieDomain = options.cookieDomain;
    var serverKey = options.serverKey;
    var cookieOption = {};

    if (cookiePath) {
      cookieOption.path = cookiePath;
    }

    if (cookieDomain) {
      cookieOption.domain = cookieDomain;
    }

    // encrypt cookie if found in response header
    core.add('writeHead', function (statusCode, headers, next) {
      if (headers.hasOwnProperty(cookieName)) {
        // build the cookie string from specified property of `headers`
        var originalCookie = headers[cookieName];
        // sign the cookie by hmac
        var signed = auth.sign(originalCookie[0], originalCookie[1], originalCookie[2], serverKey);
        // encrypt signed cookie into base64 string
        var encryptedBase64 = cipher(signed, secureKey, {outputEncoding: 'base64'});
        // set other cookie option
        var option = extend({}, cookieOption, originalCookie[3]);
        option.expires = originalCookie[1];

        // make the cookie
        var cookieStr = stringify(cookieName, encryptedBase64, option);
        // delete the original raw cookie
        delete headers[cookieName];

        // try to put the cookie string into `headers`
        var setCookie = this.getHeader('Set-Cookie');
        if (!Array.isArray(setCookie)) {
          setCookie = [];
        }
        setCookie.push(cookieStr);
        this.setHeader('Set-Cookie', setCookie);

        next(statusCode, headers);
      } else {
        // do nothing and go to next step
        return true;
      }
    });

    return function (req, res, go) {
      var cookies = parse(req.headers.cookie);
      var cookie = cookies[cookieName];

      if (cookie) {
        var decrypted = auth.verify(decipher(cookie, secureKey, {inputEncoding: 'base64'}), serverKey);
        if (!decrypted) {
          return go();
        }
        var data = decrypted[2];
        try {
          data = JSON.parse(decrypted[2]);
        } catch (e) {
          console.error('JSON parsing error for object: %s', data);
        }
        this.session = extend({}, this.session, {
          cookieId: decrypted[0],
          cookieExpires: new Date(decrypted[1]),
          cookieData: data
        });
        // for later usage
        this.cookies = cookies;
      }
      go();
    };
  }
};