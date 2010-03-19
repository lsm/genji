/**
 * Make consistent interface for different libraries
 */
//var d = require("../utils").debug;

try {
    // get hashlib from http://github.com/brainfucker/hashlib
    expose(require("hashlib1"));
} catch(e) {
    expose(require("./jshash-2.2"));
}

function expose(lib) {
    exports.md5 = lib.md5;
    exports.sha1 = lib.sha1;
    exports.sha256 = lib.sha1;
    exports.sha512 = lib.sha1;
    exports.hmac_md5 = lib.hmac_md5;
    exports.hmac_sha1 = lib.hmac_sha1;
    exports.md5_file = lib.md5_file;
}

/* vim:tabstop=4:expandtab:sw=4:softtabstop=4
*/