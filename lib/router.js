/**
 * Module dependencies
 */

var chain = require('./control').chain;
var util = require('./util');
var extend = util.extend;
var toArray = util.toArray;

/**
 * Module exports
 */

exports.Router = Router;

/**
 * Constructor function of Router class
 *
 * @param routes {Array}
 * @param defaultHandler {Function}
 * @param parentType {String}
 * @constructor
 */

function Router(routes, defaultHandler, parentType) {
  this.rules = [];
  this.defaultHandler = defaultHandler;
  this.parentType = parentType;
  Array.isArray(routes) && this.mount(routes);
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
   * @param notFound {Function} Optional function to handle miss matched request
   * @return {Boolean} True if matched otherwise false
   * @public
   */

  route: function (type, url, context, notFound) {
    function route(context, input, routes, notFound) {
      var _routes = routes[input.type];
      if (_routes) {
        for (var i in _routes) {
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
              // route to submodule
              if (route(context, input, _route.routes)) {
                return true;
              }
            }
          }
        }
      }

      if (input.type !== 'NOTFOUND') {
        // if nothing matched, route to `NOTFOUND` and do appropriate opreations.
        if (route(context, {condition: input.condition, type: 'NOTFOUND', matched: input.matched}, routes)) {
          return true;
        }
      }
      // if rules of `NOTFOUND` is not matched, call the `notFound` function if supplied.
      return !!(notFound && notFound.call(this));
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
      self.add(def.method, def.pattern, def.handleFunction, def.options);
    });
  },

  /**
   * Add a signle route definition to this router
   *
   * @param method
   * @param pattern
   * @param handleFunction
   * @param options
   * @return {*}
   * @public
   */

  add: function (method, pattern, handleFunction, options) {
    var _method = method.toUpperCase();
    options = options || {};
    var handlerClass = options.handlerClass || this.defaultHandler;
    var hooks = options.hooks;

    if (this.supportedMethods.indexOf(_method) === -1) {
      throw new Error('Routing method `' + _method + '` not supported.');
    }

    var rule = {type: _method, pattern: pattern};

    // sanity check for all possible formats of handleFunction
    if (Array.isArray(handleFunction) && Array.isArray(handleFunction[0])) {
      // handleFunction is an array of sub-url routing definitions
      var routes = handleFunction;
      routes.forEach(function (def) {
        if (!Array.isArray(def)) throw new Error('Element of sub-url definition should be type of array.');
      });

      var self = this;
      routes.forEach(function (url, idx) {
        var def = self.normalizeRouteDefinition(url, {method: _method});
        if (hooks) {
          def.options.hooks = self.stackHook(hooks, def.options.hooks);
        }
        routes[idx] = [def.pattern, def.handleFunction, def.method, def.options];
      });

      var subRouter = new Router(routes, handlerClass, rule.type);
      rule.rules = subRouter.rules;
    } else if ('function' === typeof handleFunction) {
      // the simplest case, `handleFunction` is a function
      rule._handleFunction = handleFunction;
      if (hooks) {
        rule.hooks = hooks;
        handleFunction = this.stackHook(hooks, [handleFunction]);
        // build the function chain
        handleFunction = this.chainFn(handleFunction);
      }
      rule.handleFunction = handleFunction;
      if (handlerClass) rule.handlerClass = handlerClass;
    } else {
      throw new Error('Format of url definition not correct' +
        ', second item of definition array should be a function or definition of sub-urls. Got: ' + typeof handleFunction);
    }
    // reversed for `NOTFOUND` make it easy to override the default one
    _method === 'NOTFOUND' ? this.rules.unshift(rule) : this.rules.push(rule);
    return this;
  },

  /**
   * Get the built routes of the router. Routes can be used to do routing with `route` method
   *
   * @return {Object}
   * @public
   */

  getRoutes: function () {
    if (!this.routes) {
      this.routes = this.build();
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

      function _hook(rules) {
        rules.forEach(function (rule) {
          if (rule.rules) {
            _hook(rule.rules);
          } else {
            rule.hooks = self.stackHook(hooks, rule.hooks);
            rule.handleFunction = self.stackHook(rule.hooks, [rule._handleFunction]);
            rule.handleFunction = self.chainFn(rule.handleFunction);
          }
        });
      }

      _hook(this.rules);
      this.routes = this.build();
    }
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
    if (pattern instanceof RegExp) return pattern;
    if (typeof pattern === "string") return new RegExp(pattern);
    throw new Error("Invaild url pattern");
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
    var pattern = route[0], handleFunction = route[1], method = route[2], options = route[3], handlerClass, hooks;
    defaults = defaults || {};
    if ('string' !== typeof method) {
      options = method;
      method = defaults.method || 'get';
    }

    var optionsType = Array.isArray(options) ? 'array' : typeof options;

    switch (optionsType) {
      case 'object':
        hooks = options.hooks;
        handlerClass = options.handlerClass;
        break;
      case 'array':
        hooks = options;
        break;
      case 'function':
        handlerClass = options;
        break;
    }

    options = {handlerClass: handlerClass};
    options.hooks = this.normalizeHooks(hooks);

    return {pattern: pattern, handleFunction: handleFunction, method: method, options: options};
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
   * @private
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
      h.apply(this, args) && next();
    });
    return function () {
      fn(0, arguments, this);
    };
  },

  /**
   * Build and return routes definition object which can be used by `route` method
   *
   * @return {Object}
   * @private
   */

  build: function (rules) {
    var routes = {};
    rules = rules || this.rules;
    var self = this;
    rules.forEach(function (rule) {
      var hasSub = Array.isArray(rule.rules) && rule.rules.length > 0;
      var type = rule.type.toUpperCase();
      var handlerClass = rule.handlerClass;
      var handleFunction = rule.handleFunction;
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
          matched[0] = new handlerClass(context);
          handleFunction.apply(context, matched);
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

    return routes;
  }
};
