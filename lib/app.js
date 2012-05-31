// Load dependencies
var extend = require('./util').extend;
var toArray = require('./util').toArray;
var EventEmitter = require('events').EventEmitter;
var util = require('util');

exports.DEFAULT_APP = '_defaultApp';
exports.App = App;
exports.AppRoute = AppRoute;
exports.Route = Route;

/**
 * App is reusable application module based on genji framework
 */
function App(name, properties, staticProperties) {

  // outer `global` context
  var _global = this;
  // App name
  var _name = name;
  // listeners of result events
  AppConstructor._results = {};
  // url map
  AppConstructor._routes = {};
  // listeners of route result events
  AppConstructor._routeResults = {};

  function AppConstructor(options, properties, staticProperties) {
    if (_global === this) {
      // subclassing a defined App
      var appName = options;
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
    // url prefix (root)
    var options_ = options || {};
    // root not defined
    if (!options_.urlPrefix) {
      // using app name as prefix
      options_.urlPrefix = '^/' + this.name.toLowerCase();
    }
    this.urlPrefix = options_.urlPrefix;
    if (this.urlPrefix[0] !== '^') {
      this.urlPrefix = '^' + this.urlPrefix;
    }

    // bind result events
    processResultEvents(this);
    // call initialization function if any
    if (typeof this.init === 'function') {
      this.init.apply(this, toArray(arguments));
    }
  }

  // App as an emitter
  util.inherits(AppConstructor, EventEmitter);

  // additional instance methods
  AppConstructor.prototype.onRouteResult = function (event, listener) {
    // add event prefix
    var routeEvent = 'route:' + event;
    var self = this;
    // bind route specific listener
    this.on(routeEvent, function () {
      // context for result event listener
      var args = toArray(arguments);
      var ctx = {
        app:self,
        handler: args.shift()
      };
      listener.apply(ctx, args);
    });
    return this;
  };

  AppConstructor.prototype.onResult = function (event, listener) {
    this.on(event, listener);
    return this;
  };

  AppConstructor.prototype.getRoutes = function () {
    if (!this.routesProcessed) {
      this.processRoutes();
    }
    return this.routes;
  };

  AppConstructor.prototype.processRoutes = function () {
    if (!AppConstructor._routes) return;
    var self = this;
    self.routesProcessed = true;
    self.routes = self.routes || [];
    var routes = self.routes;
    Object.keys(AppConstructor._routes).forEach(function (routeName) {
      var route = routes[routeName];
      route.method = (route.method || 'get').toLowerCase();
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
            // put event name back with prefix `route:`
            args.unshift('route:' + event);
            // emit the route result event
            originalEmit.apply(self, args);
            // emit the normal result event with oringinal event name
            args[0] = event;
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
      if (route.url[0] !== '^') {
        route.url = self.urlPrefix + route.url;
      }
      self.routes.push(route);
    });
  };

  AppConstructor.prototype.preHook = function (hooks) {

  };

  function processResultEvents(app) {
    // bind route result events
    var routeResults = AppConstructor._routeResults;
    routeResults && Object.keys(routeResults).forEach(function (resultEvent) {
      var resultListener = routeResults[resultEvent];
      if (Array.isArray(resultListener)) {
        resultListener.forEach(function (listener) {
          app.onRouteResult(resultEvent, listener);
        });
      } else {
        app.onRouteResult(resultEvent, resultListener);
      }
    });
    // bind result events
    var results = AppConstructor._results;
    results && Object.keys(results).forEach(function (resultEvent) {
      var resultListener = results[resultEvent];
      if (Array.isArray(resultListener)) {
        resultListener.forEach(function (listener) {
          app.on(resultEvent, listener);
        });
      } else {
        app.on(resultEvent, resultListener);
      }
    });
  }

  Object.keys(properties).forEach(function (propKey) {
    switch (propKey) {
      case 'results':
        extend(AppConstructor._results, properties['results']);
        break;
      case 'routeResults':
        extend(AppConstructor._routeResults, properties['routeResults']);
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


/**
 * Applicaiton object manage set of url routing rules
 *
 * @param name
 * @param options
 * @constructor
 */
function AppRoute(name, options) {
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

AppRoute.prototype._formatPattern = function (pattern) {
  if (pattern[0] === '^') {
    // consider as a full url matching pattern
    return pattern;
  } else if (this._root === '^/' && pattern[0] === '/') {
    return this._root + pattern.slice(1);
  }
  return this._root + pattern;
};

AppRoute.prototype.get = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new Route('GET'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

AppRoute.prototype.post = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new Route('POST'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

AppRoute.prototype.put = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new Route('PUT'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

AppRoute.prototype.del = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new Route('DELETE'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

AppRoute.prototype.head = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new Route('HEAD'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

AppRoute.prototype.notFound = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new Route('NOTFOUND'))
    .pattern(pattern)
    .fn(handleFunction)
    .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

AppRoute.prototype.mount = function (routes) {
  this._routes = this._routes.concat(routes);
  return this;
};

AppRoute.prototype.toRoutes = function () {
  var routes = [];
  this._routes.forEach(function (route) {
    if (route instanceof Route) {
      route = route.toRoute();
    }
    route[0] = this._formatPattern(route[0]);
    routes.push(route);
  }, this);
  return routes;
};

/**
 * Signal route definition object
 */
function Route(method) {
  this._options = {method:method || 'GET'};
}

Route.prototype.get = function (name) {
  return this._options[name];
};

Route.prototype.method = function (method) {
  this._options.method = method;
  return this;
};

Route.prototype.pattern = function (pattern) {
  this._options.pattern = pattern || '';
  return this;
};

Route.prototype.fn = function (fn) {
  this._options.fn = fn;
  return this;
};

Route.prototype.handler = function (handler) {
  this._options.handler = handler;
  return this;
};

Route.prototype.hook = function (pre, post) {
  pre && this.preHook(pre);
  post && this.postHook(post);
  return this;
};

Route.prototype.preHook = function (hooks) {
  if (!Array.isArray(this.get('preHooks'))) {
    this._options.preHooks = [];
  }
  if (!Array.isArray(hooks)) {
    hooks = [hooks];
  }
  this._options.preHooks = this._options.preHooks.concat(hooks);
  return this;
};

Route.prototype.postHook = function (hooks) {
  if (!Array.isArray(this.get('postHooks'))) {
    this._options.postHooks = [];
  }
  if (!Array.isArray(hooks)) {
    hooks = [hooks];
  }
  this._options.postHooks = this._options.postHooks.concat(hooks);
  return this;
};

Route.prototype.getHooks = function () {
  var hooks = {};
  Array.isArray(this.get('preHooks')) && (hooks.pre = this.get('preHooks'));
  Array.isArray(this.get('postHooks')) && (hooks.post = this.get('postHooks'));
  return hooks.pre ? hooks : null;
};

Route.prototype.toRoute = function () {
  return [
    this.get('pattern'),
    this.get('fn'),
    this.get('method'),
    this.get('handler'),
    this.getHooks()
  ];
};

