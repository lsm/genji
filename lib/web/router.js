// inspired http://github.com/defrex/node.routes.js/
var http = require("http");

function route(handler, urls) {
    var url = handler.request.url;
    urls.some(function(e) {
        // @todo replace callbacks, deal with double `handler'
        var replaced = url.replace(e[0], "");
        /*
        return (handler.request.url = url.replace(e[0], function(match) {
                e[1].call(handler, handler, arguments);
                return match;
            })) != url;
        */
        if (replaced != url) { // pattern matched and replaced
            handler.request.url = replaced; // for future matches of nested urls
            e[1].call(handler, handler, e[0].exec(url).slice(1));
            //e[1](handler, e[0].exec(url).slice(1)); // performance of using `handler' directly is better than using `this'
            return true;
        }
        return false;
    }) || handler.notFound();
}

function method(allowed) {
    return function(handler) {
        return (handler.request.method === allowed) ? true : handler.error(405, "Method not allowed");
    }
}

exports.get = method("GET");
exports.post = method("POST");
exports.put = method("PUT");
exports.del = method("DELETE");

// attach plugins onto the main function
// plugin function return true will break the plugin-chain, and main function will not be called
exports.attach = function(func, plugins) {
    // @todo add func and plugins check
    return function(handler, args) {
        // call each function in the `plugins' array,
        // return false (or nothing) if you want to stop excuting the plugin-chain
        plugins.every(function(e) {
            return e.call(handler, handler, args);
        }) && func.call(handler, handler, args);
        // finally call our main function, if all plugins return true
    };
}

exports.include = function(urls) {
    return function(handler) {
        route(handler, urls);
    }
}

// @todo verify urls, check regex (convert if get string) and function etc.

exports.listen = function(urls, HandlerClass, options) {
    options = options || [];
    http.createServer(function(request, response) {
        route(new HandlerClass(request, response), urls);
    }).listen(options.port || 8000, options.host || '127.0.0.1');
};