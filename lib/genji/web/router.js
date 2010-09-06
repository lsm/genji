var chain = require('../pattern/control').chain;


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
    // if nothing matched, route to `NOTFOUND` and do appropriate opreations.
    if (input.type != 'NOTFOUND') {
        input.type = 'NOTFOUND';
        if (route.call(this, input, rules)) {
            return true;
        }
    }
    // even rules of `NOTFOUND` is not matched, call the `notFound` function if supplied.
    notFound && notFound.call(this);
}


function Router(urls, defaultHandler) {
    this.rules = [];
    var _fromDeclared = function(urls) {
        urls.forEach(function (url) {
            //var url = urls[i];
            var pattern = url[0], handleFunction, method = url[2], handlerClass, hooks;
            if (typeof url[1] == 'function') {
                handleFunction = url[1];
            } else if (!Array.isArray(url[1])) {
               throw new Error('Format of url definition not correct'
                    + ', second item of definition array should be a function or array of functions or definition of sub-urls.'
                    + 'Got: ' + typeof url[1]);
            }
            if (typeof url[3] == 'function') {
                handlerClass = url[3];
                hooks = url[4];
            } else {
                hooks = url[3];
            }
            handlerClass = handlerClass || defaultHandler;
            this.add(method, pattern, handleFunction, handlerClass, hooks);
        }, this);
    }
    urls && _fromDeclared.call(this, urls);
}

Router.prototype = {
    add: function(method, pattern, handleFunction, handlerClass, hooks) {
        method = method.toUpperCase();
        var preHooks;
        if (hooks.pre) {
            // do sanity check for pre hooks
            if(!Array.isArray(hooks.pre)) {
                throw new Error('Pre hook must be array of functions')
            }
            chain(hooks.pre, function(hook, idx, hooks, next) {
                if (typeof hook != 'function') throw new Error('Pre hook must be array of functions');
                next();
            })();
            preHooks = hooks.pre;
        }
        if (['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'NOTFOUND'].indexOf(method) == -1) {
            throw new Error('Http method `' + method + '` not supported.');
        }
        var rule = {type: method, pattern: pattern};
        if (Array.isArray(handleFunction)) {
            // sanity check for all possible formats of handleFunction
            if (typeof handleFunction[0] == 'function') {
                // handleFunction is array of functions (hooks + handle functions)
                chain(handleFunction, function(hook, idx, hooks, next) {
                    if (typeof hook != 'function') throw new Error('All elements should be type of function.');
                    next();
                })();
                if (preHooks) {
                    // if we have pre hooks, put them in front of handle functions
                    handleFunction = preHooks.concat(handleFunction);
                }
                // build the function chain
                var fnChain = chain(handleFunction, function(h, idx, arr, next, args) {
                    h.apply(this, args) && next();
                });
                handleFunction = function() {
                    fnChain(0, arguments, this);
                };
            } else if (Array.isArray(handleFunction[0])) {
                // handleFunction is array of sub-url definitions
                chain(handleFunction, function(def, idx, defs, next) {
                    if (!Array.isArray(def)) throw new Error('All elements should be type of array.');
                    next();
                })();
                // set pre hooks and handlerClass for sub-url
                if (preHooks) {
                    handleFunction.forEach(function(h, idx, arr) {
                        if (!h[3]) {
                            h[3] = preHooks;
                        } else if (typeof h[3] == 'function') {
                            if (!h[4]) h[4] = preHooks;
                        }
                    });
                }
                var subRouter = new Router(handleFunction, handlerClass);
                rule.urls = subRouter.rules;
            }
        } else {
            rule.handleFunction = handleFunction;
            if (handlerClass) rule.handlerClass = handlerClass;
        }
        // reversed for `NOTFOUND` make it easy to override the default one
        method === 'NOTFOUND' ? this.rules.unshift(rule) : this.rules.push(rule);
        return this;
    },

    get: function(pattern, handleFunction, handlerClass) {
        return this.add('GET', pattern, handleFunction, handlerClass);
    },

    post: function(pattern, handleFunction, handlerClass) {
        return this.add('POST', pattern, handleFunction, handlerClass);
    },

    put: function(pattern, handleFunction, handlerClass) {
        return this.add('PUT', pattern, handleFunction, handlerClass);
    },

    del: function(pattern, handleFunction, handlerClass) {
        return this.add('DELETE', pattern, handleFunction, handlerClass);
    },

    head: function(pattern, handleFunction, handlerClass) {
        return this.add('HEAD', pattern, handleFunction, handlerClass);
    },

    notFound: function(pattern, handleFunction, handlerClass) {
        return this.add('NOTFOUND', pattern, handleFunction, handlerClass);
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
        handlerClass = url.handlerClass, handleFunction = url.handleFunction,
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
                handleFunction.apply(new handlerClass(this), args);
            }
            current.match = function(condition) {
                return pattern.exec(condition);
            }
        }
        if (hasSub) {
            // also push the rules to type `prefix`
            if (!ret.hasOwnProperty('PREFIX')) ret.PREFIX = [];
            ret.PREFIX.push(current);
        } else {
            ret[type].push(current);
        }
    });
    for(var type in ret) {
        if (type != 'PREFIX') {
            ret[type] = ret[type].concat(ret.PREFIX);
        }
    }
    return ret;
}