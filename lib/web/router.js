// inspired http://github.com/defrex/node.routes.js/

var http = require("http");

function route(handler, urls) {
    var url = handler.url;
    urls.some(function(e) {
        var replaced = url.replace(e[0], "");
        if (replaced != url) { // pattern matched and replaced
            handler.url = replaced; // for future matches of nested urls
            e[1](handler, e[0].exec(url).slice(1)); 
            return true;
        }
        return false;
    }) || handler.error(404);
}

function checkURLs(urls) {
    function _checkPattern(pattern) {
        if (pattern instanceof RegExp) return pattern;
        if (typeof pattern === "string") return new RegExp(pattern);
        throw new Error("Invaild url pattern");
    }
    return urls.map(function(url) {
        //check url pattern
        url[0] = _checkPattern(url[0]);
        // check url handler
        if (typeof url[1] !== "function") throw new Error("The url handler is not a function.");
        return url;
    });
}

function method(allowed) {
    return function(handler) {
        return (handler.method === allowed) ? true : handler.error(405);
    }
}

exports.get = method("GET");
exports.post = method("POST");
exports.put = method("PUT");
exports.del = method("DELETE");
exports.head = method("HEAD");

// attach plugins onto the main function
exports.attach = function(func, plugins) {
    return function(handler, args) {
        // call each function in the plugins array,
        // return false (or nothing) if you want to stop excuting the plugin-chain
        plugins.every(function(plugin) {
            return plugin(handler, args);
        }) && func(handler, args);
        // finally call our main function, if all plugins return true
    };
}

exports.include = function(urls) {
    urls = checkURLs(urls);
    return function(handler) {
        route(handler, urls);
    }
}

exports.listen = function(urls, HandlerClass, options) {
    options = options || [];
    urls = checkURLs(urls);
    http.createServer(function(request, response) {
        route(new HandlerClass(request, response), urls);
    }).listen(options.port || 8000, options.host || '127.0.0.1');
};


/* vim:tabstop=4:expandtab:sw=4:softtabstop=4
*/