// inspired http://github.com/defrex/node.routes.js/

var http = require("http");

function _route(handler, urls) {
    var url = handler.url;
    urls.some(function(e) {
        if (e[2] && e[2] !== handler.method) return false; // check http method
        handler.url = url.replace(e[0], ""); // try to replace matched part
        if (handler.url != url) {// pattern matched
            e[1](handler, e[0].exec(url)); // call handle function
            return true;
        }
        return false;
    }) || handler.error(404);
}

function _checkPattern(pattern) {
    if (pattern instanceof RegExp) return pattern;
    if (typeof pattern === "string") return new RegExp(pattern);
    throw new Error("Invaild url pattern");
}
function _checkPlugins(plugins) {
    return plugins.every(function(plugin) {
        return typeof plugin == "function";
    });
}

function _formatURLs(urls) {
    return urls.map(function(url) {
        //check url pattern
        url[0] = _checkPattern(url[0]);
        // check url handler
        if (url[1] instanceof Array) {
            url[1] = (function(u) {
                u = _formatURLs(u);
                return function(handler) {
                    route(handler, u);
                }
            })(url[1]);
        } else if (typeof url[1] !== "function") {
            throw new Error("Second element of url patterns should be function or array of patterns.");
        }
        // format method
        if (typeof url[2] == "string") {
            url[2] = url[2].toUpperCase();
        } else {
            url[2] = false;
        }
        // format plugins
        if (url[3] instanceof Array) {
            if (_checkPlugins(url[3])) {
                url[1] = _attach(url[1], url[3]);
            } else {
                throw new Error("Plugin must be a function");
            }
        }
        return url;
    });
}

// attach plugins onto the main function
function _attach(func, plugins) {
    return function(handler, args) {
        // call each function in the plugins array,
        // return false (or nothing) if you want to stop excuting the plugin-chain
        plugins.every(function(plugin) {
            return plugin(handler, args);
        }) && func(handler, args);
    // finally call our main function, if all plugins return true
    };
}

exports.listen = function(urls, HandlerClass, options) {
    options = options || [];
    urls = _formatURLs(urls);
    http.createServer(function(request, response) {
        _route(new HandlerClass(request, response), urls);
    }).listen(options.port || 8000, options.host || '127.0.0.1');
};