/**
 * Module dependencies
 */

var chain = require('./control').chain;
var util = require('./util');
var extend = util.extend;
var toArray = util.toArray;
var Context = require('./core').Context;

/**
 * Module exports
 */

exports.Router = Router;

/**
 * Constructor function of Router class
 *
 * @param [routes] {Array} Optional predefined routing definitions
 * @param [options] {Object} Optional router options which may contains:
 *   - "contextClass" The constructor function of the context class
 *   - "urlRoot" The default url prefix
 * @constructor
 * @private
 */

function Router(routes, options) {
  this.rules = [];
  if (!Array.isArray(routes)) {
    options = routes;
    routes = null;
  }
  options = options || {};
  this.urlRoot = options.urlRoot || '^/';
  if (this.urlRoot[0] !== '^') {
    this.urlRoot = '^' + this.urlRoot;
  }
  if (this.urlRoot[this.urlRoot.length - 1] !== '/') {
    this.urlRoot += '/';
  }
  this.contextClass = options.contextClass || Context;
  if (Array.isArray(routes)) {
    this.mount(routes);
  }
}

/**
 * Prototype object of Router class
 *
 * @type {Object}
 */

Router.prototype = {

  /**
   * Supported routing types
   */

  supportedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'NOTFOUND'],

  /**
   * The routing method that routes and dispatches incoming request
   *
   * @param type {String} Type of the routing request
   * @param url {String} Url of the request
   * @param context {Object} Dispatching context
   * @param [notFound] {Function} Optional function to handle miss matched request
   * @return {Boolean} True if matched otherwise false
   * @public
   */

  route: function (type, url, context, notFound) {
    function route(context, input, routes, notFound) {
      var _routes = routes[input.type];
      if (_routes) {
        for (var i in _routes) {
          if (_routes.hasOwnProperty(i)) {
            var _route = _routes[i];
            var condition = input.matched ? input.matched : input.condition;
            var matched = _route.match(condition);
            // matched or replaced
            if (matched !== null) {
              if (Array.isArray(matched)) {
                // destination arrived, do dispatching
                // and keep the context of `route`
                _route.dispatch(matched, context);
                return true;
              } else if (matched !== condition) {
                // part of the `condition` is replaced, `matched` will become new condition
                input.matched = matched;
                // route to sub-module
                if (route(context, input, _route.routes)) {
                  return true;
                }
              }
            }
          }
        }
      }

      if ('NOTFOUND' !== input.type) {
        // if nothing matched, route to `NOTFOUND` and do appropriate operations.
        if (route(context, {condition: input.condition, type: 'NOTFOUND', matched: input.matched}, routes)) {
          return true;
        }
      }
      // if rules of `NOTFOUND` is not matched, call the `notFound` function if supplied.
      return !!(notFound && notFound.call(context, context.request, context.response));
    }

    var input = {type: type, condition: url};
    return route(context, input, this.getRoutes(), notFound);
  },

  /**
   * Add batch of routing rules in declarative format
   *
   * @param routes {Array} Array of routes definition
   * @public
   */

  mount: function (routes) {
    var self = this;
    routes.forEach(function (route) {
      var def = self.normalizeRouteDefinition(route);
      self.add(def.method, def.pattern, def.handler, def.hooks);
    });
  },

  /**
   * Add a signle route definition to this router
   *
   * @param method {String} Http method string
   * @param pattern {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function that will be called during dispatch
   * @param [hooks] {Array|Function} An optional hook object:
   *  - Array: an array of hook functions
   *  - Function: a single pre hook function
   * @return {Object}
   * @public
   */

  add: function (method, pattern, handler, hooks) {
    var _method = method.toUpperCase();

    if (this.supportedMethods.indexOf(_method) === -1) {
      throw new Error('Routing method `' + _method + '` not supported.');
    }

    var rule = {type: _method, pattern: pattern};

    // sanity check for all possible formats of handler
    if (Array.isArray(handler) && Array.isArray(handler[0])) {
      // handler is an array of sub-url routing definitions
      var routes = handler;
      routes.forEach(function (def) {
        if (!Array.isArray(def)) {
          throw new Error('Element of sub-url definition should be type of array.');
        }
      });

      var self = this;
      routes.forEach(function (url, idx) {
        var def = self.normalizeRouteDefinition(url, {method: _method});
        if (hooks) {
          def.hooks = self.stackHook(hooks, def.hooks);
        }
        routes[idx] = [def.pattern, def.handler, def.method, def.hooks];
      });

      var subRouter = new Router(routes);
      rule.rules = subRouter.rules;
    } else if ('function' === typeof handler) {
      // the simplest case, `handler` is a function
      rule._handleFunction = handler;
      if (hooks) {
        rule.hooks = hooks;
        handler = this.stackHook(hooks, [handler]);
        // build the function chain
        handler = this.chainFn(handler);
      }
      rule.handler = handler;
    } else {
      throw new Error('Format of url definition not correct' +
        ', second item of definition array should be a function or definition of sub-urls. Got: ' + typeof handler);
    }
    // reversed for `NOTFOUND` make it easy to override the default one
    if ('NOTFOUND' === _method) {
      this.rules.unshift(rule);
    } else {
      this.rules.push(rule);
    }
    return this;
  },

  /**
   * Define a route with type 'GET'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @param [hooks] {Array|Function} An optional hook object:
   *  - Array: an array of hook functions
   *  - Function: a single pre hook function
   * @return {Object}
   * @public
   */

  get: function (url, handler, hooks) {
    this.mount([
      [url, handler, 'get', hooks]
    ]);
    return this;
  },

  /**
   * Define a route with type 'POST'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @param [hooks] {Array|Function} An optional hook object:
   *  - Array: an array of hook functions
   *  - Function: a single pre hook function
   * @return {Object}
   * @public
   */

  post: function (url, handler, hooks) {
    this.mount([
      [url, handler, 'post', hooks]
    ]);
    return this;
  },

  /**
   * Define a route with type 'PUT'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @param [hooks] {Array|Function} An optional hook object:
   *  - Array: an array of hook functions
   *  - Function: a single pre hook function
   * @return {Object}
   * @public
   */

  put: function (url, handler, hooks) {
    this.mount([
      [url, handler, 'put', hooks]
    ]);
    return this;
  },

  /**
   * Define a route with type 'DELETE'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @param [hooks] {Array|Function} An optional hook object:
   *  - Array: an array of hook functions
   *  - Function: a single pre hook function
   * @return {Object}
   * @public
   */

  'delete': function (url, handler, hooks) {
    this.mount([
      [url, handler, 'delete', hooks]
    ]);
    return this;
  },

  /**
   * Define a route with type 'HEAD'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @param [hooks] {Array|Function} An optional hook object:
   *  - Array: an array of hook functions
   *  - Function: a single pre hook function
   * @return {Object}
   * @public
   */

  head: function (url, handler, hooks) {
    this.mount([
      [url, handler, 'head', hooks]
    ]);
    return this;
  },

  /**
   * Define a route with type 'NOTFOUND'
   *
   * @param url {String|RegExp} A RegExp instance or string to repersent matching pattern
   * @param handler {Function} Function to handle the request
   * @param [hooks] {Array|Function} An optional hook object:
   *  - Array: an array of hook functions
   *  - Function: a single pre hook function
   * @return {Object}
   * @public
   */

  notFound: function (url, handler, hooks) {
    this.mount([
      [url, handler, 'notFound', hooks]
    ]);
    return this;
  },

  /**
   * Get the built routes of the router.
   *
   * @return {Object} Routes object which can be used to do routing with `route` method
   * @public
   */

  getRoutes: function () {
    if (!this.routes) {
      this.build();
    }
    return this.routes;
  },

  /**
   * Add global hooks to all existent routes
   *
   * @param hooks {Function|Array} Hook functions
   * @public
   */

  hook: function (hooks) {
    hooks = this.normalizeHooks(hooks);
    if (Array.isArray(hooks) && hooks.length > 0) {
      var self = this;
      var _hook = function (rules) {
        rules.forEach(function (rule) {
          if (rule.rules) {
            _hook(rule.rules);
          } else {
            rule.hooks = self.stackHook(hooks, rule.hooks);
            rule.handler = self.stackHook(rule.hooks, [rule._handleFunction]);
            rule.handler = self.chainFn(rule.handler);
          }
        });
      };
      _hook(this.rules);
      this.routes = this.build();
    }
  },

  /**
   * Generate a url based on the camel cased name string
   *
   * @param name {String} Camel cased name
   * @returns {string}
   * @public
   */

  slashCamelCase: function (name) {
    name = name.replace(/([A-Z]+)/g, function (word) {
      return '/' + word.toLowerCase();
    });
    return name;
  },

  /**
   * Combine url with perfix
   *
   * @param prefix {String} Prefix string
   * @param url {String} Url string
   * @returns {String}
   * @public
   */

  prefixUrl: function (prefix, url) {
    switch (url[0]) {
      case '^':
        return url;
      case '/':
        url = url.slice(1);
        break;
    }

    if (prefix[prefix.length - 1] !== '/') {
      prefix += '/';
    }
    url = prefix + url;
    return url;
  },

  /**
   * Listen to the request event of HttpServer instance
   *
   * @param server {Object} Instance object of "http.HttpServer"
   * @param contextClass {Function} The context constructor function
   * @param [notFound] {Function} Optional function to handle miss matched url
   * @public
   */

  listen: function (server, contextClass, notFound) {
    var self = this;
    contextClass = contextClass || this.contextClass;
    if ('function' !== typeof notFound) {
      notFound = function (request, response) {
        response.statusCode = 404;
        response.end('404 not found!', 'utf8');
        console.error('Cannot match a route for url "%s" method "%s"', request.url, request.method);
      };
    }
    server.on('request', function (request, response) {
      var context = new contextClass(request, response);
      self.route(request.method, request.url, context, notFound);
    });
  },

  /**
   * Check the input url pattern and format it to regexp if need
   *
   * @param {String|RegExp} pattern Url pattern in format of string or regular expression
   * @returns {RegExp}
   * @throws {Error}
   * @private
   */

  normalizePattern: function (pattern) {
    if (pattern instanceof RegExp) {
      return pattern;
    }
    if (typeof pattern === "string") {
      pattern = this.prefixUrl(this.urlRoot, pattern);
      return new RegExp(pattern);
    }
    throw new Error("Invalid url pattern");
  },

  /**
   * Normalize the route definition array to object
   *
   * @param route {Array} Single route definition array
   * @param [defaults] {Object} Optional default value for missed value, only support `method` (e.g. {method: 'get'})
   * @return {Object}
   * @private
   */

  normalizeRouteDefinition: function (route, defaults) {
    var method = route[2];
    var hooks = route[3];
    defaults = defaults || {};

    if ('string' !== typeof method) {
      hooks = method;
      method = defaults.method || 'get';
    }

    hooks = this.normalizeHooks(hooks);

    return {pattern: route[0], handler: route[1], method: method, hooks: hooks};
  },

  /**
   * Convert function to array and add `null` to end of array if necessary
   *
   * @param hooks
   * @returns {Array}
   * @private
   */

  normalizeHooks: function (hooks) {
    if (hooks) {
      // do sanity check for pre hooks
      if ('function' === typeof hooks) {
        hooks = [hooks];
      } else if (!Array.isArray(hooks)) {
        throw new Error('Hooks must be a function or array of functions');
      }
      hooks.forEach(function (hook) {
        if ('function' !== typeof hook && null !== hook) {
          throw new Error('Hooks must be array of functions with optional null placeholder for function being hooked.');
        }
      });

      if (hooks.indexOf(null) === -1) {
        // all pre hooks
        hooks.push(null);
      }
    }
    return hooks;
  },

  /**
   * Wrap targetHooks with srcHooks
   *
   * @param srcHooks {Array} Array of src hooks
   * @param [targetHooks] Optional target hooks
   * @returns {Array}
   * @public
   */

  stackHook: function (srcHooks, targetHooks) {
    targetHooks = targetHooks || [null];
    srcHooks = this.normalizeHooks(srcHooks);
    var idx = srcHooks.indexOf(null);
    var pre = srcHooks.slice(0, idx++);
    targetHooks = pre.concat(targetHooks);
    if (idx !== srcHooks.length) {
      var post = srcHooks.slice(idx);
      targetHooks = targetHooks.concat(post);
    }
    return targetHooks;
  },

  /**
   * Convert array of functions to a function chain which can be called in serial order
   *
   * @param fns {Array} Array of functions
   * @returns {Function}
   * @private
   */

  chainFn: function (fns) {
    var fn = chain(fns, function (h, idx, arr, next, args) {
      args = toArray(args);
      args.push(next);
      if (h.apply(this, args)) {
        next();
      }
    });
    return function () {
      fn(0, arguments, this);
    };
  },

  /**
   * Build and return routes definition object which can be used by `route` method
   *
   * @param [rules] {Array}
   * @return {Object}
   * @public
   */

  build: function (rules) {
    var routes = {};
    var _rules = rules;
    rules = rules || this.rules;
    var self = this;
    rules.forEach(function (rule) {
      var hasSub = Array.isArray(rule.rules) && rule.rules.length > 0;
      var type = rule.type.toUpperCase();
      var handler = rule.handler;
      var pattern = self.normalizePattern(rule.pattern);

      var current = {id: type + '_' + pattern.toString()};

      if (hasSub) {
        // sub-urls
        current.match = function (condition) {
          return condition.replace(pattern, '');
        };
        current.routes = self.build(rule.rules);
        type = 'PREFIX';
      } else {
        current.dispatch = function (matched, context) {
          matched[0] = context;
          handler.apply(null, matched);
        };
        current.match = function (condition) {
          return pattern.exec(condition);
        };
      }

      if (!routes.hasOwnProperty(type)) {
        routes[type] = {};
      }

      routes[type][current.id] = current;
    });

    if (routes.PREFIX) {
      this.supportedMethods.forEach(function (type) {
        if (type !== 'NOTFOUND') {
          // method of sub-url may various, so put `prefix` to all types
          routes[type] = routes[type] || {};
          extend(routes[type], routes.PREFIX);
        }
      });
    }

    if (!_rules) {
      this.routes = routes;
    }
    return routes;
  }
};
