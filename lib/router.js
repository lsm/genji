var chain = require('./control').chain;


function route(input, rules, notFound) {
  var _rules = rules[input.type];
  if (_rules) {
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
  }

  if (input.type != 'NOTFOUND') {
    // if nothing matched, route to `NOTFOUND` and do appropriate opreations.
    if (route.call(this, {condition: input.condition, type: 'NOTFOUND', matched: input.matched}, rules)) {
      return true;
    }
  }
  // if rules of `NOTFOUND` is not matched, call the `notFound` function if supplied.
  return notFound && notFound.call(this);
}


var supportedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'NOTFOUND'];

function Router(urls, defaultHandler, parentType) {
  this.rules = [];
  this.defaultHandler = defaultHandler;
  this.parentType = parentType;
  Array.isArray(urls) && this.mount(urls);
}

Router.prototype = {

  mount: function(urls) {
    urls.forEach(function (url) {
      var pattern = url[0], handleFunction = url[1], method = url[2], handlerClass, hooks, offset;
      if (typeof method === 'string') {
        offset = 0;
      } else {
        offset = -1;
        method = this.parentType ? this.parentType : 'GET';
      }
      if (typeof url[3 + offset] === 'function') {
        handlerClass = url[3 + offset];
        hooks = url[4 + offset];
      } else {
        hooks = url[3 + offset];
      }
      handlerClass = handlerClass || this.defaultHandler;
      this.add(method, pattern, handleFunction, handlerClass, hooks);
    }, this);
  },

  add: function(method, pattern, handleFunction, handlerClass, hooks) {
    method = method.toUpperCase();
    handlerClass = handlerClass || this.defaultHandler;
    var preHooks;
    if (hooks) {
      // do sanity check for pre hooks
      if (hooks.pre) {
        if (!Array.isArray(hooks.pre)) {
          throw new Error('Pre hook must be array of functions');
        }
        chain(hooks.pre, function(hook, idx, hooks, next) {
          if (typeof hook != 'function') throw new Error('Pre hook must be array of functions');
          next();
        })();
        preHooks = hooks.pre;
      } else {
        throw new Error('Format of hooks must be: {pre: [func1, func2, func3...]}\nCurrently only support pre hooks');
      }
    }
    if (supportedMethods.indexOf(method) === -1) {
      throw new Error('Routing method `' + method + '` not supported.');
    }
    var rule = {type: method, pattern: pattern};
    // sanity check for all possible formats of handleFunction
    if (Array.isArray(handleFunction)) {
      if (typeof handleFunction[0] === 'function') {
        // handleFunction is array of functions (hooks + handle functions)
        chain(handleFunction, function(hook, idx, hooks, next) {
          if (typeof hook !== 'function') throw new Error('All elements should be type of function.');
          next();
        })();
        if (preHooks) {
          // if we have pre hooks, put them in front of handle functions
          handleFunction = preHooks.concat(handleFunction);
        }
        // build the function chain
        var fnChain = chain(handleFunction, function(h, idx, arr, next, args) {
          this.next = next;
          h.apply(this, args) && next();
        });
        handleFunction = function() {
          fnChain(0, arguments, this);
        };
        rule.handleFunction = handleFunction;
        if (handlerClass) rule.handlerClass = handlerClass;
      } else if (Array.isArray(handleFunction[0])) {
        // handleFunction is array of sub-url definitions
        chain(handleFunction, function(def, idx, defs, next) {
          if (!Array.isArray(def)) throw new Error('All elements should be type of array.');
          next();
        })();
        // set pre hooks and handlerClass for sub-url
        if (preHooks) {
          handleFunction.forEach(function(h, idx, arr) {
            // we can choose not to define `method`, use default 'GET' instead
            var offset = typeof h[2] === 'string' ? 0 : -1, h3Type = typeof h[3 + offset];
            if (h3Type === 'undefined') {
              // both handlerClass and hooks are not specified
              h[3 + offset] = {pre: preHooks};
            } else if (h3Type === 'function') {
              // sub-url has its own handler class
              if (!h[4 + offset]) {
                // sub-url has no hooks defined, use parents' hooks instead
                h[4 + offset] = {pre: preHooks};
              } else {
                // sub-url has its own hooks, merge with parents' hooks
                h[4 + offset] = {pre: preHooks.concat(h[4 + offset].pre)};
              }
            } else if (h3Type === 'object' && Array.isArray(h[3 + offset].pre)) {
              // sub-url has hooks defined, merge with parents' hooks
              h[3 + offset] = {pre: preHooks.concat(h[3 + offset].pre)};
            }
            arr[idx] = h;
          });
        }
        // default `handlerClass` of sub-url is parent's `handlerClass`
        var subRouter = new Router(handleFunction, handlerClass, rule.type);
        // sub-url doesn't have `handleFunction` and `handlerClass`, only need `urls`.
        rule.urls = subRouter.rules;
      }
    } else if (typeof handleFunction === 'function') {
      // the simplest case, `handleFunction` is a function
      if (preHooks) {
        // merge if we have pre hooks
        handleFunction = preHooks.concat(handleFunction);
        // build the function chain
        var fn = chain(handleFunction, function(h, idx, arr, next, args) {
          this.next = next;
          h.apply(this, args) && next();
        });
        handleFunction = function() {
          fn(0, arguments, this);
        };
      }
      rule.handleFunction = handleFunction;
      if (handlerClass) rule.handlerClass = handlerClass;
    } else {
      throw new Error('Format of url definition not correct' +
          ', second item of definition array should be a function or array of functions or definition of sub-urls.' +
          'Got: ' + typeof handleFunction);
    }
    // reversed for `NOTFOUND` make it easy to override the default one
    method === 'NOTFOUND' ? this.rules.unshift(rule) : this.rules.push(rule);
    return this;
  },

  toRules: function() {
    return _build(this.rules);
  }
};

module.exports = {
  Router: Router,
  route: route
};

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
      };
      current.rules = _build(url.urls);
    } else {
      current.dispatch = function(matched) {
        matched[0] = new handlerClass(this);
        handleFunction.apply(this, matched);
      };
      current.match = function(condition) {
        return pattern.exec(condition);
      };
    }
    if (hasSub) {
      // also push the rules to type `prefix`
      if (!ret.hasOwnProperty('PREFIX')) ret.PREFIX = [];
      ret.PREFIX.push(current);
    } else {
      ret[type].push(current);
    }
  });
  for (var idx in supportedMethods) {
    // method of sub-url may various, so put `prefix` to all types
    var type = supportedMethods[idx];
    if (type !== 'NOTFOUND') {
      if (ret.PREFIX) {
        ret[type] = ret[type] || [];
        ret[type] = ret[type].concat(ret.PREFIX);
      }
    }
  }
  return ret;
}