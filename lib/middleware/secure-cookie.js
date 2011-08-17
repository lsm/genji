/**
 * Decrypt secure cookie and verify
 */


var util = require('../util'),  
    c = require('../crypto'),
    cipher = c.cipher,
    decipher = c.decipher,
    auth = require('../auth'),
    cookieHelper = require('../cookie'),
    parse = cookieHelper.parse,
    stringify = cookieHelper.stringify;

module.exports = {
  name: 'SecureCookie',
  make: function(conf) {
    var secureKey = conf.secureKey,
        cookieName = conf.cookieName,
        cookiePath = conf.cookiePath,
        cookieDomain = conf.cookieDomain,
        serverKey = conf.serverKey,
        cookieOption = {};
    if (cookieDomain) cookieOption.domain = cookieDomain;
    if (cookiePath) cookieOption.path = cookiePath;

    // encrypt cookie if found in response header
    this.add('writeHead', function(statusCode, headers) {
      if (headers.hasOwnProperty(cookieName)) {
        // build the cookie string from specified property of `headers`
        var o = headers[cookieName],
          // sign the cookie by hmac
            signed = auth.sign(o[0], o[1], o[2], serverKey),
          // encrypt signed cookie by cipher
            encrypted = cipher(signed, secureKey, {outputEncoding: 'binary'}),
          // encode the encryoted into base64
            encryptedBase64 = c.base64Encode(encrypted, 'binary');
        cookieOption.expires = o[1];
        // make the cookie
        var cookieStr = stringify(cookieName, encryptedBase64, cookieOption);
        // delete the original raw cookie
        delete headers[cookieName];

        // try to put the cookie string into `headers`
        var setCookie = headers['Set-Cookie'] || headers['set-cookie'];
        if (!setCookie) {
          // just set if cookie not exists
          headers['Set-Cookie'] = cookieStr;
        } else {
          if (Array.isArray(setCookie)) {
            setCookie.push(cookieStr);
            headers['Set-Cookie'] = setCookie;
          } else {
            throw new Error("@FIXME Sorry, I don't know how to set cookie.");
          }
        }
        this.next(statusCode, headers);
      } else {
        // do nothing and go to next step
        return true;
      }
    });

    return function(req, res, go) {
      var cookies = parse(req.headers.cookie),
          cookie = cookies[cookieName];
      if (cookie) {
        var dcrypted = auth.verify(decipher(cookie, secureKey, {inputEncoding: 'base64'}), serverKey);
        if (!dcrypted) return go();
        this.userObj = {
          id: dcrypted[0],
          expires: dcrypted[1],
          data: dcrypted[2]
        };
        // for later usage
        this.cookies = cookies;
      }
      go();
    };
  }
};