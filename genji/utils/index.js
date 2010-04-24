var sys = require('sys'),
_inspect = sys.inspect,
_debug = sys.debug;

exports.debug = function() {
    for (var arg in arguments) {
    	if (typeof arguments[arg] === "object") {
        	_debug("[object]\n" + _inspect(arguments[arg]));
        } else {
        	_debug("[" + typeof arguments[arg] + ']\n' + arguments[arg]);
        }
    }
};

exports.main = function(filename) {
    return process.mainModule.filename === filename;
}

exports.manage = require("./manage");