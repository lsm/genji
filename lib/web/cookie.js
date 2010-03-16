// http://github.com/jed/cookie-node/ 

var crypto = require('node-crypto/crypto');

var _hmac = new crypto.Hmac;
var cookie_secret = "wfmpo-=0i23r;,./,ll;123`12&^%$#@";


function _hmac_sha1(secret, values) {
    return _hmac.init("sha1", secret).update(values.join("|")).digest("hex");
}

function sign(values) {
    //values.push((new Date()).getTime());
    return values.join("|") + "|" + _hmac_sha1(cookie_secret, values);
}

function verify(value) {
    var values = value.split("|");
    values.pop();
    return value === sign(values);
}

// this funtion will sign/unsign all cookies in request and response
function sign_plugin(request, response) {
    
}

exports.sign = sign;
exports.verify = verify;