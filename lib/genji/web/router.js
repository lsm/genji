// inspired http://github.com/defrex/node.routes.js/

var http = require("http"),
slice = Array.prototype.slice;

/**
 * Route request base on the url definitions
 *
 * @private
 * @param {Object} request http.ServerRequest object
 * @param {Object} response http.ServerResponse object
 * @param {Array} urls Array of url to function map
 * @param {Object} handler Instance of handler class, used only for nested url rules
 */
function _route(request, response, urls, handler) {
    var url = 'URL' in  request ? request.URL : request.url;
    return urls.some(function(e) {
        // members of e: 0. handler class 1. url parttern 2. handle function 3. http method
        if (e[3] && e[3] !== request.method) return false; // check http method
        request.URL = url.replace(e[1], function() {
            var args = slice.call(arguments, 1, -2); // get only what we need
            // use existent handler instance or create a new one
            args.unshift(handler || new e[0](request, response));
            // call our "handle" function (maybe _route for sub urls)
            e[2].apply(null, args);
            return '';
        });
        return request.URL != url;
    });
}

/**
 * Check the input url parttern
 *
 * @private
 * @param {String|RegExp} pattern Url pattern in format of string or regular expression
 * @throws {Error}
 */
function _checkPattern(pattern) {
    if (pattern instanceof RegExp) return pattern;
    if (typeof pattern === "string") return new RegExp(pattern);
    throw new Error("Invaild url pattern");
}

/**
 * Plugin should be a funciton
 *
 * @private
 * @param {Array} plugins Array of plugins
 */
function _checkPlugins(plugins) {
    return plugins.every(function(plugin) {
        return typeof plugin === "function";
    });
}

/**
 * Build the url from the definition array
 *
 * @private
 * @param {Array} urls Url rules
 * @param {Boolean} nested Indicate child url rules
 * @returns {Array} formated url rules
 */
function _formatURLs(urls, nested) {
    return urls.map(function(url) {
        var handlerClass;
        if (!nested && typeof url[0] === 'function' && ! (url[0] instanceof RegExp)) {
            // typeof RegExp instance is function?
            // custom handler class
            handlerClass = url.shift();
        }
        var urlPattern = url[0],
        handleFunc = url[1],
        method = url[2],
        plugins = url[3];
       if (typeof method === "string") {
            // format method
           method = method.toUpperCase();
       } else if (Array.isArray(method) && plugins === undefined) {
           // method is not provided, won't check http method
           plugins = method;
           method = false;
       }
        //check url pattern
        urlPattern = _checkPattern(urlPattern);
        // check handle function
        if (Array.isArray(handleFunc)) {
            // nested url rules, customize handler class is not supported for nested patterns (using parent's handler).
            var childUrls = _formatURLs(handleFunc, true);
            handleFunc = function(handler) {
                _route(handler.request, handler.response, childUrls, handler);
            }
        } else if (typeof handleFunc !== "function") {
            throw new Error("Wrong definition, function or array of patterns should be supplied.");
        }

        // format plugins
        if (plugins instanceof Array) {
            if (_checkPlugins(plugins)) {
                handleFunc = _attach(handleFunc, plugins);
            } else {
                throw new Error("Plugin must be a function");
            }
        }

        url = [urlPattern, handleFunc, method];
        plugins && url.push(plugins);
        
        if (handlerClass) {
            url.unshift(handlerClass);
        } else if (nested) {
            // for _route
            url.unshift(null);
        }
        return url;
    });
}

/**
 * Call plugins before we call the handle function
 *
 * @param {Function} func The handle function
 * @param {Array} plugins Array of functions (as plugin)
 * @returns {Function}
 */
function _attach(func, plugins) {
    return function() {
        var args = arguments;
        // call each function in the plugins array,
        // return false (or nothing) if you want to stop excuting the plugin-chain
        plugins.every(function(plugin) {
            return plugin.apply(null, args);
        }) && func.apply(null, args);// finally call our main function, if all plugins return true
    };
}

/**
 * Wrap the http.createServer function, handle reuqest and response according to the parameters.
 *
 * @param {Array} urls Array of url patterns
 * @param {Function} HandlerClass Constructor function of the web handler class
 * @param {Object} options Define host, port and maybe other stuff
 * @returns {Object} instance of http.Server object
 */
exports.createServer = function(urls, HandlerClass, options) {
    if (typeof HandlerClass !== 'function') throw new Error('Invaild handler class.');
    
    options = options || [];
    urls = _formatURLs(urls);
    urls.forEach(function(url) {
        if (url[0] instanceof RegExp) {
            // handler class not specified, use default one
            url.unshift(HandlerClass);
        }
    });
    
    var server = http.createServer(function(request, response) {
        var found = _route(request, response, urls);
        if (!found) {
            // @todo should be able to customize
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            response.end('Content not found');
        }
    });
    server.listen(options.port || 8000, options.host || '127.0.0.1');
    return server;
}