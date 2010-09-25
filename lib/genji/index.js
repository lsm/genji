var env;

/**
 * Merge two object
 *
 * @param {Object}
 */
function merge(a, b) {
    for (var name in b) {
       if (!Array.isArray(a[name]) && typeof a[name] == 'object' && typeof b[name] == 'object') {
           a[name] = merge(a[name], b[name]);
       } else {
           a[name] = b[name];
       }
    }
}

function setupEnv(settings) {
    if (!exports.env) {
        exports.env = settings;
        if (!exports.env.genjiPath) exports.env.genjiPath = __dirname.slice(0, -6);
        if (!exports.env.appPath) exports.env.appPath = process.env.PWD;
    } else {
        merge(exports.env, settings);
    }
}

// exports modules
exports.pattern = require("./pattern");
exports.util = require("./util");
exports.web = require("./web");
exports.setupEnv = setupEnv;
exports.env = env;