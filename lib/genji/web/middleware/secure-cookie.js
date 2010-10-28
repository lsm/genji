/**
 * Decrypt secure cookie and verify
 */


var c = require('../../util/crypto'),
cipher = c.cipher,
decipher = c.decipher
cookieHandler = require('../handler/cookie'),
auth = require('../auth'),
cookieHelper = require('../cookie');

module.exports = {
    name: 'SecureCookie',
    make: function(conf) {
        var secureKey = conf.secureKey,
        cookieName = conf.name,
        cookiePath = conf.path,
        cookieDomain = conf.domain,
        serverKey = conf.serverKey,
        cookieOption = {};
        if (cookieDomain) cookieOption.domain = cookieDomain;
        if (cookiePath) cookieOption.path = cookiePath;

        // encrypt cookie if found in response header
        this.add('writeHead', function(statusCode, headers) {
            if (headers.hasOwnProperty(cookieName)) {
                // build the cookie string from specified property of `headers`
                var o = headers[cookieName],
                signed = auth.sign(o[0], o[1], o[2], serverKey),
                encrypted = cipher(signed, secureKey);
                cookieOption.expires = o[1];
                var cookieStr = cookieHelper.stringify(cookieName, encrypted, cookieOption);
                // delete the semi-finished cookie
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
            var cookie = cookieHelper.parse(req.headers.cookie, cookieName);
            if (cookie) {
                var dcrypted = auth.verify(decipher(cookie, secureKey), serverKey);
                if (!dcrypted) return go();
                this.userObj = {
                    id: dcrypted[0],
                    expires: dcrypted[1],
                    data: dcrypted[2]
                };
            }
            go();
        }
        
    }
};