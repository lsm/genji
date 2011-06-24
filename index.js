/**
 * Dependencies
 */
var http = require('http');
var Middleware = require('./lib/middleware');
var App = require('./lib/app').App;

// Global private variables
var _apps = {};
var _middlewares = {};
var _router;
var _defaultApp = '_defaultApp';


// Public apis

function app(name, options) {
  name = name || _defaultApp;
  if (_apps[name] instanceof App) {
    return _apps[name];
  }
  if (!_router) {
    var Router = require('./lib/router').Router;
    var SimpleHandler = require('./lib/handler').SimpleHandler;
    _router = new Router(null, SimpleHandler);
    use('router');
  }
  options = options || {};
  _apps[name] = new App(name, options);
  return _apps[name];
}


function use(name, options) {
  _middlewares[name] = options || {};
  return exports;
}

function createServer() {
  if (_router) {
    Object.keys(_apps).forEach(function(name) {
      _router.mount(_apps[name].toRoutes());
    });
    _middlewares['router'].urls = _router
  }
  return http.createServer(Middleware(_middlewares));
}

exports.app = app;
exports.use = use;
exports.createServer = createServer;