// inspired http://github.com/defrex/node.routes.js/

var http = require("http");

// customize handler class
//function _route(request, response, urls) {
//    var url = request.url;
//    urls.some(function(e) {
//        if (e[3] && e[3] !== request.method) return false; // check http method
//        url = url.replace(e[1], ""); // try to replace matched part
//        if (url != request.url) {// pattern matched
//            e[2](new e[0](request, response), e[1].exec(url)); // call handle function
//            return true;
//        }
//        return false;
//    }) || handler.error(404);
//}

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
        return typeof plugin === "function";
    });
}

function _formatURLs(urls) {
    return urls.map(function(url) {
//        var handlerClass;
//        if (!nested && typeof url[0] === 'function') {
//            // custom handler class
//            handlerClass = url.shift();
//        }
        //check url pattern
        url[0] = _checkPattern(url[0]);
        // check url handler
        if (Array.isArray(url[1])) {
            // nested url definition, customize handler class is not supported for nested patterns.
            var u = _formatURLs(url[1]);
            url[1] = function(handler) {
                    _route(handler, u);
                }
        } else if (typeof url[1] !== "function") {
            throw new Error("Wrong definition, function or array of patterns should be supplied.");
        }
        // format method
        if (typeof url[2] === "string") {
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
//        handlerClass && url.unshift(handlerClass);
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
    var preMiddleware, postMiddleware;
    options = options || [];
    urls = _formatURLs(urls);
    if (typeof HandlerClass !== 'function') throw new Error('Invaild handler class.');
//    urls.forEach(function(url) {
//        if (typeof url[0] !== 'function') {
//            // handler class not specified, use default one
//            url.unshift(HandlerClass);
//        }
//    });
    if (options.hasOwnProperty('middleware')) {
        preMiddleware = options.middleware.pre;
        //postMiddleware = options.middleware.post;
    }
    var server = http.createServer(function(request, response) {
        if (preMiddleware) {
            preMiddleware.forEach(function(middleware, idx) {
                middleware.call(server, request, response, idx);
            });
        }
        _route(new HandlerClass(request, response), urls);
    });
    server.listen(options.port || 8000, options.host || '127.0.0.1');
    return server;
};