
// Global private variables
var _apps = {};
var _middlewares = {};
var _router;
var _defaultApp = '_defaultApp';
var _shorted;


// Public apis

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

function use(name, options) {
  _middlewares[name] = options || {};
  return exports;
}

function require_(module) {
  return require('./' + module);
}

function short() {
  if (_shorted) return exports;
  var util = require('./util');
  var extend = util.extend;
  // extends submodules to the `genji` namespace
  extend(exports, util);
  extend(exports, {Base: require('./base')});
  extend(exports, require('./control'));
  _shorted = true;
  return exports;
}

function createServer(options) {
  if (_router) {
    Object.keys(_apps).forEach(function(name) {
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

exports.app = app;
exports.use = use;
exports.require = require_;
exports.short = short;
exports.createServer = createServer;
exports.VERSION = '0.2.3';