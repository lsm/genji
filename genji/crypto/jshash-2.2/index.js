var md5 = require("./md5");
var sha1 = require("./sha1");
var sha256 = require("./sha256");
var sha512 = require("./sha512");
var fs = require("fs");

function makeHash(hash) {
    return function(input) {
        if (typeof input !== "string") input = String(input);
        // convert to string if necessary
        return hash(input);
    }
}

function makeHmac(hmac) {
    return function(m, k) {
        // as convention, message then key
        if (typeof k !== "string") k = String(k);
        if (typeof m !== "string") m = String(m);
        return hmac(k, m);
    };
}

exports.md5 = makeHash(md5.md5);
exports.sha1 = makeHash(sha1.sha1);
exports.sha256 = makeHash(sha256.sha256);
exports.sha512 = makeHash(sha512.sha512);
exports.hmac_md5 = makeHmac(md5.hmac_md5);
exports.hmac_sha1 = makeHmac(sha1.hmac_sha1);
exports.md5_file = function(path, callback) {
    fs.readFile(path, function(err, content) {
        if (err) throw err;
        callback(exports.md5(content));
    });
    return true; // @todo do we need return since we already have callback?
}
//exports.hmac_sha256 = makeHmac(sha256.hmac_sha256);
//exports.hmac_sha512 = makeHmac(sha512.hmac_sha512);