


function route(input, rules, notFound) {
    var _rules = rules[input.type];
    for (var i in _rules) {
        var rule = _rules[i];
        var condition = input.matched ? input.matched : input.condition;
        var matched = rule.match(condition);
        // matched or replaced
        if (matched !== null) {
            if (Array.isArray(matched)) {
                // destination arrived, do dispatching
                // and keep the context of `route`
                rule.dispatch.call(this, matched);
                return true;
            } else if (matched !== condition) {
                // part of the `condition` is replaced, `matched` will become new condition
                input.matched = matched;
                // route to submodule
                if (route.call(this, input, rule.rules)) {
                    return true;
                }
            }
        }
    }
    // if nothing matched, call `notFound` if supplied.
    notFound && notFound();
}


function Router(urls, defaultHandler) {
    this.rules = [];
    function _fromDeclared(urls) {
        for (var i in urls) {
           var url = urls[i];
           var pattern = url[0], handleFunction, method, handler;
           if (typeof url[1] == 'function') {
               handleFunction = url[1];
           } else if (Array.isArray(url[1])) {
               handleFunction = new Router(url[1], defaultHandler);
           } else {
               throw new Error('Format of url definition not correct'+
                   ', second item of definition array should be a function or definition of sub-urls');
           }
           if (typeof url[2] == 'string') {
               method = url[2];
               handler = url[3];
           } else {
               handler = url[2];
           }
            method = method || "GET";
            handler = handler || defaultHandler;
            this.add(method, pattern, handleFunction, handler);
        }
    }
    urls && _fromDeclared.call(this, urls);
}

Router.prototype = {
    add: function(method, pattern, handleFunction, handler) {
        method = method.toUpperCase();
        if (['GET', 'POST', 'PUT', 'DELETE', 'HEAD'].indexOf(method) == -1) {
            throw new Error('Http method `' + method + '` not supported.');
        }
        var rule = {type: method, pattern: pattern};
        if (handleFunction instanceof Router) {
            rule.urls = handleFunction.rules;
        } else {
            rule.handleFunction = handleFunction;
            if (handler) rule.handler = handler;
        }
        this.rules.push(rule);
        return this;
    },

    get: function(pattern, handleFunction, handler) {
        return this.add('GET', pattern, handleFunction, handler);
    },

    post: function(pattern, handleFunction, handler) {
        return this.add('POST', pattern, handleFunction, handler);
    },

    put: function(pattern, handleFunction, handler) {
        return this.add('PUT', pattern, handleFunction, handler);
    },

    del: function(pattern, handleFunction, handler) {
        return this.add('DELETE', pattern, handleFunction, handler);
    },

    head: function(pattern, handleFunction, handler) {
        return this.add('HEAD', pattern, handleFunction, handler);
    },

    toRules: function() {
        return _build(this.rules);
    }
}

module.exports = {
    Router: Router,
    route: route
}

// private functions

/**
 * Check the input url pattern and format it to regexp if need
 *
 * @private
 * @param {String|RegExp} pattern Url pattern in format of string or regular expression
 * @returns {RegExp}
 * @throws {Error}
 */
function _formatPattern(pattern) {
    if (pattern instanceof RegExp) return pattern;
    if (typeof pattern === "string") return new RegExp(pattern);
    throw new Error("Invaild url pattern");
}

function _build(urls) {
    var ret = {};
    urls.forEach(function(url) {
        var hasSub = url.urls && url.urls.length > 0, type = url.type.toUpperCase(),
        handler = url.handler, handleFunction = url.handleFunction,
        pattern = _formatPattern(url.pattern);
        if (!ret.hasOwnProperty(type)) {
            ret[type] = [];
        }
        var current = {};

        if (hasSub) {
            // sub-urls
            current.match = function(condition) {
                return condition.replace(pattern, '');
            }
            current.rules = _build(url.urls);
        } else {
            current.dispatch = function(matched) {
                var args = matched && matched.slice(1);
                handleFunction.apply(new handler(this), args);
            }
            current.match = function(condition) {
                return pattern.exec(condition);
            }
        }
        if (hasSub) {
            // also push the rules to type `prefix`
            if (!ret.hasOwnProperty('prefix')) ret['prefix'] = [];
            ret['prefix'].push(current);
        } else {
            ret[type].push(current);
        }
    });
    for(var type in ret) {
        if (type != 'prefix') {
            ret[type] = ret[type].concat(ret.prefix);
        }
    }
    return ret;
}