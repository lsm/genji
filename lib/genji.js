// # The genji object #
// The top level namespace of `genji`

// ## Global shared private variables ##
// Some objects for holding instances of app, router etc.

// Cached apps object
var _apps = {};
// Cached middleware object
var _middlewares = {};
// Global `Router` instance
var _router;
// Default app name
var _defaultApp = '_defaultApp';


// ## Helper functions for http app/server ##

// The `genji.app` function takes two arguments, `name` as the app name and `options` as the options of app.
// `options` could have following properties:
//    - `handler`: default handler for this router instace
//    - `root`: url prefix of the router (regular expression in string form)
function app(name, options) {
  var App = require('./app').App;
  name = name || _defaultApp;
  if (_apps[name] instanceof App) {
    return _apps[name];
  }
  options = options || {};
  if (!_router) {
    var Router = require('./router').Router;
    var Handler = options.handler || require('./handler').Handler;
    _router = new Router(null, Handler);
    use('router');
  }
  _apps[name] = new App(name, options);
  return _apps[name];
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
    Object.keys(_apps).forEach(function (name) {
      _router.mount(_apps[name].toRoutes());
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

// extend other submodules with module name as namesapce
extend(exports, {auth: require('./auth')});
extend(exports, {client: require('./client')});
extend(exports, {cookie: require('./cookie')});
extend(exports, {crypto: require('./crypto')});
extend(exports, {handler: require('./handler')});
extend(exports, {mime: require('./mime')});
extend(exports, {router: require('./router')});
extend(exports, {view: require('./view')});

// functions for creating http app/server
exports.app = app;
exports.use = use;
exports.createServer = createServer;

// version of `genji`
exports.VERSION = '0.3.3';


// ## Deprecated functions ##
exports.require = require_;
exports.short = short;

function require_(module) {
  console.log('Warning: function `genji.require()` is deprecated. Submodules are exported by default.');
  return require('./' + module);
}

function short() {
  console.log('Warning: function `genji.short()` is deprecated. Submodules are exported by default.');
  return exports;
}
