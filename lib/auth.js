/**
 * Secured cookie implementation based on this pubilcation:
 * A Secure Cookie Protocol (http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.92.7649&rep=rep1&type=pdf)
 *
 * More about salted hash, goto:
 * http://phpsec.org/articles/2005/password-hashing.html or http://www.aspheute.com/english/20040105.asp
 *
 * @todo more secured way (e.g. http://gitorious.com/django-password-model)
 */

var c = require('./crypto'),
    sha1 = c.sha1,
    hmac_sha1 = c.hmac_sha1;

function sign(username, expiration, data, serverKey) {
  var k = hmac_sha1([username, expiration].join("|"), serverKey);
  if (typeof data !== "string") data = JSON.stringify(data);
  var raw = [username, expiration, data].join("|");
  return raw + "|" + hmac_sha1(raw, k);
}

function verify(input, serverKey) {
  if (typeof input !== "string") return false;
  var values = input.split("|");
  if (values.length !== 4) return false;
  if (new Date() >= new Date(values[1])) return false;
  var k = hmac_sha1([values[0], values[1]].join("|"), serverKey);
  return values.pop().replace(/[\x00-\x20]/g, "") === hmac_sha1(values.join("|"), k) ? values : false;
}

function checkPassword(password, raw) {
  var pass = password.split("$");
  // "algo$salt$hash"
  if (pass.length === 3) {
    if (pass[0] === "sha1") {
      return pass[2] === sha1(pass[1] + raw);
    }
  }
  return false;
}

function makePassword(raw) {
  var salt = sha1("" + Math.random() + Math.random()).slice(0, 9);
  return 'sha1$' + salt + "$" + sha1(salt + raw);
}

exports.sign = sign;
exports.verify = verify;
exports.checkPassword = checkPassword;
exports.makePassword = makePassword;