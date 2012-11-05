// # The genji object #
// The top level namespace of `genji`

// ## version of `genji` ##
exports.VERSION = '0.5.6';

// ## Global shared private variables ##
// Objects for holding instances of app, router etc.

// Cached apps object
var _appRoutes = {};
// Cached middleware object
var _middlewares = {};
// Global `Router` instance
var _router;
// Default app name
var _defaultApp = '_defaultApp';


// ## Helper functions for http route/app/server ##

// The `genji.route` function takes two arguments, `name` as the route name and `options` as the options of route.
// `options` could have following properties:
//    - `handler`: default handler for this router instance
//    - `root`: url prefix of the router (regular expression in string form)
function route(name, options) {
  var AppRoute = require('./app').AppRoute;
  name = name || _defaultApp;
  if (_appRoutes[name] instanceof AppRoute) {
    return _appRoutes[name];
  }
  options = options || {};
  if (!_router) {
    _router = new exports.router.Router(null, options.handler || exports.handler.Handler);
    use('router');
  }
  _appRoutes[name] = new AppRoute(name, options);
  return _appRoutes[name];
}

function loadApp(app) {
  var routes = app.getRoutes();
  if (!_router) {
    _router = new exports.router.Router(null, exports.handler.Handler);
    use('router');
  }
  routes.forEach(function (route) {
    _router.add(route.method, route.url, route.handleFunction, route.handlerClass, route.hooks);
  });
}

// Use a middleware `name` with `options`
function use(name, options) {
  _middlewares[name] = options || {};
  return exports;
}

// Create and return native nodejs `HttpServer` instance.
// Initiate url router and middleware of `genji`.
function createServer(options) {
  if (_router) {
    Object.keys(_appRoutes).forEach(function (name) {
      _router.mount(_appRoutes[name].toRoutes());
    });
    _middlewares.router.urls = _router;
  }
  var server;
  var Middleware = require('./middleware');
  if (options && options.key && options.cert) {
    var https = require('https');
    server = https.createServer(options, Middleware(_middlewares))
  } else {
    var http = require('http');
    server = http.createServer(Middleware(_middlewares));
  }
  return server;
}

// ## Expose public apis of submodules ##

var util = require('./util');
var extend = util.extend;

// extend frequently used submodules to the `genji` namespace
extend(exports, util);
extend(exports, {Base:require('./base')});
extend(exports, require('./control'));
extend(exports, {Model: require('./model').Model});
extend(exports, {App: require('./app').App});
extend(exports, {View: require('./view').View});
extend(exports, {Role: require('./role').Role});

// extend other submodules with module name as namesapce
extend(exports, {auth: require('./auth')});
extend(exports, {cookie: require('./cookie')});
extend(exports, {crypto: require('./crypto')});
extend(exports, {handler: require('./handler')});
extend(exports, {mime: require('./mime')});
extend(exports, {router: require('./router')});
extend(exports, {view: require('./view')});

// functions for route, middleware and http server
exports.route = route;
exports.use = use;
exports.createServer = createServer;
exports.loadApp = loadApp;