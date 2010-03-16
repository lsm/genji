exports.web = require("./web");
exports.utils = require("./utils");
process.mixin(GLOBAL, {_d: exports.utils.debug});
