// Load dependencies
var extend = require('./util').extend;
var toArray = require('./util').toArray;
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var BaseHandler = require('./handler').BaseHandler;

exports.DEFAULT_APP = '_defaultApp';
exports.App = App;

var extend = require('./util').extend;

function App(name, properties, staticProperties) {

  // outer `global` context
  var _global = this;
  // App name
  var _name = name;
  // listeners of result events
  AppConstructor._results = {};
  // url map
  AppConstructor._routes = {};

  function AppConstructor(appName, properties, staticProperties) {
    if (_global === this) {
      // subclassing a defined App
      // override parent instance/static properties
      var SubApp = App(appName,
        extend({}, AppConstructor.prototype, properties),
        extend({}, AppConstructor, staticProperties)
      );
      return SubApp;
    }
    // call parent constructor
    EventEmitter.call(this);
    // name of the app
    this.name = _name;
    // bind result events
    processResultEvents(AppConstructor._results, this);
    // call initialization function if any
    if (typeof this.init === 'function') {
      this.init.apply(this, toArray(arguments));
    }
  }

  // App as an emitter
  util.inherits(AppConstructor, EventEmitter);

  // additional instance methods
  AppConstructor.prototype.onResult = function (event, listener) {
    this.on(event, function () {
      // context for result event listener
      var ctx = {
        app:app
      };
      var args = toArray(arguments);
      var arg1 = args.shift();
      // detect handler instance
      if (app.routesProcessed && arg1 instanceof BaseHandler) {
        ctx.handler = arg1;
      } else {
        args.unshift(arg1);
      }
      listener.apply(ctx, args);
    });
  };

  AppConstructor.prototype.getRoutes = function () {
    if (!this.routesProcessed) {
      this.processRoutes();
    }
    return this.routes;
  };

  AppConstructor.prototype.processRoutes = function () {
    var self = this;
    self.routesProcessed = true;
    self.routes = self.routes || {};
    Object.keys(AppConstructor._routes).forEach(function (routeName) {
      var route = routes[routeName];
      route.method = route.method.toLowerCase();
      if (!route.handleFunction) {
        route.handleFunction = function handleFunction(handler) {
          var args = toArray(arguments);
          // shift off `handler`
          args.shift();
          // keep the original `emit` function
          var originalEmit = self.emit;
          var _emit = function (event) {
            var args = toArray(arguments);
            // first, shift off event name
            args.shift();
            // put `handler` at the top of args
            args.unshift(handler);
            // put event name back
            args.unshift(event);
            originalEmit.apply(self, args);
          };
          var fn = self[routeName];
          if (['post', 'put', 'delete'].indexOf(route.method) > -1) {
            // `post` alike http request
            handler.on(route.type || 'params', function (input, raw) {
              // first and more are positioned arguments - the matching part of url regular expression
              // last two arguments are parsed parameters (from json or querystring) and raw data (if any)
              args.push(input);
              raw && args.push(raw);
              // your business logic function
              if (typeof fn === 'function') {
                self.emit = _emit;
                fn.apply(self, args);
                self.emit = originalEmit;
              }
            });
          } else {
            // `get` alike http request
            if (typeof fn === 'function') {
              self.emit = _emit;
              fn.apply(self, args);
              self.emit = originalEmit;
            }
          }
        };
      }
      self.routes[routeName] = route;
    });
  };


  function processResultEvents(results, app) {
    Object.keys(results).forEach(function (resultEvent) {
      var resultListener = results[resultEvent];
      if (Array.isArray(resultListener)) {
        resultListener.forEach(function (listener) {
          app.on(resultEvent, function () {
            // context for result event listener
            var ctx = {
              app:app
            };
            var args = toArray(arguments);
            var arg1 = args.shift();
            // detect handler instance
            if (app.routesProcessed && arg1 instanceof BaseHandler) {
              ctx.handler = arg1;
            } else {
              args.unshift(arg1);
            }
            listener.apply(ctx, args);
          });
        });
      } else {
        app.on(resultEvent, function () {
          // context for result event listener
          var ctx = {
            app:app
          };
          var args = toArray(arguments);
          var arg1 = args.shift();
          // detect handler instance
          if (app.routesProcessed && arg1 instanceof BaseHandler) {
            ctx.handler = arg1;
          } else {
            args.unshift(arg1);
          }
          resultListener.apply(ctx, args);
        });
      }
    });
  }

  Object.keys(properties).forEach(function (propKey) {
    switch (propKey) {
      case 'results':
        extend(AppConstructor._results, properties['results']);
        break;
      case 'routes':
        extend(AppConstructor._routes, properties['routes']);
        break;
      default:
        // treat default property as instance property
        AppConstructor.prototype[propKey] = properties[propKey];
        break;
    }
  });

  // extend static properties to constructor
  extend(AppConstructor, staticProperties);
  // return the defined `App` constructor
  return AppConstructor;
}


function App(name, options) {
  this._name = name;
  this._routes = [];
  var options_ = options || {};
  if (this._name !== exports.DEFAULT_APP && !options_.root) {
    options_.root = '^/' + this._name;
  }
  this._root = options_.root || '^/';
  if (this._root[0] !== '^') {
    this._root = '^' + this._root;
  }
}

App.prototype._formatPattern = function (pattern) {
  if (pattern[0] === '^') {
    // consider as a full url matching pattern
    return pattern;
  } else if (this._root === '^/' && pattern[0] === '/') {
    return this._root + pattern.slice(1);
  }
  return this._root + pattern;
};

App.prototype.get = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('GET'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.post = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('POST'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.put = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('PUT'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.del = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('DELETE'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.head = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('HEAD'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.notFound = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('NOTFOUND'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.mount = function (routes) {
  this._routes = this._routes.concat(routes);
  return this;
};

App.prototype.toRoutes = function () {
  var routes = [];
  this._routes.forEach(function (route) {
    if (route instanceof AppRoute) {
      route = route.toRoute();
    }
    route[0] = this._formatPattern(route[0]);
    routes.push(route);
  }, this);
  return routes;
};

/**
 * AppRouter
 *
 * @param method
 */
function AppRoute(method) {
  this._options = {method:method || 'GET'};
}

AppRoute.prototype.get = function (name) {
  return this._options[name];
};

AppRoute.prototype.method = function (method) {
  this._options.method = method;
  return this;
};

AppRoute.prototype.pattern = function (pattern) {
  this._options.pattern = pattern || '';
  return this;
};

AppRoute.prototype.fn = function (fn) {
  this._options.fn = fn;
  return this;
};

AppRoute.prototype.handler = function (handler) {
  this._options.handler = handler;
  return this;
};

AppRoute.prototype.hook = function (pre, post) {
  pre && this.preHook(pre);
  post && this.postHook(post);
  return this;
};

AppRoute.prototype.preHook = function (hooks) {
  if (!Array.isArray(this.get('preHooks'))) {
    this._options.preHooks = [];
  }
  if (!Array.isArray(hooks)) {
    hooks = [hooks];
  }
  this._options.preHooks = this._options.preHooks.concat(hooks);
  return this;
};

AppRoute.prototype.postHook = function (hooks) {
  if (!Array.isArray(this.get('postHooks'))) {
    this._options.postHooks = [];
  }
  if (!Array.isArray(hooks)) {
    hooks = [hooks];
  }
  this._options.postHooks = this._options.postHooks.concat(hooks);
  return this;
};

AppRoute.prototype.getHooks = function () {
  var hooks = {};
  Array.isArray(this.get('preHooks')) && (hooks.pre = this.get('preHooks'));
  Array.isArray(this.get('postHooks')) && (hooks.post = this.get('postHooks'));
  return hooks.pre ? hooks : null;
};

AppRoute.prototype.toRoute = function () {
  return [
    this.get('pattern'),
    this.get('fn'),
    this.get('method'),
    this.get('handler'),
    this.getHooks()
  ];
};

