var Router = require('./router').Router;
var http = require('http');
var Middleware = require('./middleware');
var SimpleHandler = require('./handler').SimpleHandler;


var _apps = {};
var _middlewares = {};
var _router;

function App(name, options) {
  this._name = name;
  this._router = getRouter();
}

App.prototype.get = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.get(pattern, handleFunction, handlerClass, hooks);
  return this;
};

App.prototype.post = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.post(pattern, handleFunction, handlerClass, hooks);
  return this;
};

App.prototype.put = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.put(pattern, handleFunction, handlerClass, hooks);
  return this;
};

App.prototype.del = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.del(pattern, handleFunction, handlerClass, hooks);
  return this;
};

App.prototype.head = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.head(pattern, handleFunction, handlerClass, hooks);
  return this;
};

App.prototype.notFound = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.notFound(pattern, handleFunction, handlerClass, hooks);
  return this;
};


function getRouter() {
  if (!_router) {
    _router = new Router(null, SimpleHandler);
    stack('router');
  }
  return _router || (_router = new Router());
}

exports.app = function(name) {
  name = name || '_defaultApp';
  if (_apps[name] instanceof App) {
    return _apps[name];
  }
  _apps[name] = new App(name);
  return _apps[name];
};

function stack(name, conf) {
  _middlewares[name] = conf || {};
}

function createServer() {
  _router && (_middlewares['router'].urls = _router);
  return http.createServer(new Middleware.makeFlaker(_middlewares));
}

exports.stack = stack;

exports.createServer = createServer;

exports.App = App;