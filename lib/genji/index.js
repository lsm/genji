var Router = require('./router').Router;
var http = require('http');
var Middleware = require('./middleware');
var SimpleHandler = require('./handler').SimpleHandler;
var App = require('./app').App;


exports.app = app;
exports.stack = stack;
exports.createServer = createServer;


var _apps = {};
var _middlewares = {};
var _router;
var _defaultApp = '_defaultApp';


function getRouter() {
  if (!_router) {
    _router = new Router(null, SimpleHandler);
    stack('router');
  }
  return _router || (_router = new Router());
}

function app(name, options) {
  name = name || _defaultApp;
  if (_apps[name] instanceof App) {
    return _apps[name];
  }
  options = options || {};
  options.router = options.router || getRouter();
  _apps[name] = new App(name, options);
  return _apps[name];
}


function stack(name, conf) {
  _middlewares[name] = conf || {};
}

function createServer() {
  if (_router) {
    Object.keys(_apps).forEach(function(name) {
      _router.mount(_apps[name].toRoutes());
    });
    _middlewares['router'].urls = _router
  }
  return http.createServer(new Middleware.makeFlaker(_middlewares));
}