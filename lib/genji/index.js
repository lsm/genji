var Router = require('./router').Router;
var http = require('http');


var _apps = {};
var _middlewares = {};
var _router;

function App(name) {
  this._name = name;
  this._router = getRouter();
}

App.prototype.root = function (path) {
  this._root = path;
  return this;
};

App.prototype.get = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.get(pattern, handleFunction, handlerClass, hooks);
  return this;
};


function getRouter() {
  if (!_router) {
    _router = new Router();
    stack('router');
  }
  return _router || (_router = new Router());
}

exports.app = function(name) {
  name = name || '_defaultApp';
  if (_apps[name] instanceof App) {
    return _apps[name];
  }
  var app = new App(name);
  _apps[name] = app;
  return app;
};

function stack(name, conf) {
  _middlewares[name] = conf;
}

function createServer() {
  return http.createServer();
}

exports.createServer = createServer;

exports.App = App;