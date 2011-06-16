var Router = require('./router').Router;
var http = require('http');
var Middleware = require('./middleware');
var SimpleHandler = require('./handler').SimpleHandler;




exports.app = app;
exports.stack = stack;
exports.createServer = createServer;




var _apps = {};
var _middlewares = {};
var _router;
var _defaultApp = '_defaultApp';

function App(name, options) {
  this._name = name;
  this._router = getRouter();
  options = options || {};
  if (this._name !== _defaultApp && !options.root) {
    options.root = '^/' + this._name;
  }
  this._root = options.root || '^/';
  if (this._root[0] !== '^') {
    this._root = '^' + this._root;
  }
  if (this._root.slice(-1) !== '/') {
    this._root += '/';
  }

}

App.prototype.formatPattern = function(pattern) {
  if (pattern.slice(0,2) === '^/') {
    return this._root + pattern.slice(2);
  } else if (pattern.slice(0,1) === '/') {
    return this._root + pattern.slice(1);
  }
  return this._root + pattern;
};

App.prototype.get = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.get(this.formatPattern(pattern), handleFunction, handlerClass, hooks);
  return this;
};

App.prototype.post = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.post(this.formatPattern(pattern), handleFunction, handlerClass, hooks);
  return this;
};

App.prototype.put = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.put(this.formatPattern(pattern), handleFunction, handlerClass, hooks);
  return this;
};

App.prototype.del = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.del(this.formatPattern(pattern), handleFunction, handlerClass, hooks);
  return this;
};

App.prototype.head = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.head(this.formatPattern(pattern), handleFunction, handlerClass, hooks);
  return this;
};

App.prototype.notFound = function (pattern, handleFunction, handlerClass, hooks) {
  this._router.notFound(this.formatPattern(pattern), handleFunction, handlerClass, hooks);
  return this;
};


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
  _apps[name] = new App(name, options);
  return _apps[name];
};

function stack(name, conf) {
  _middlewares[name] = conf || {};
}

function createServer() {
  _router && (_middlewares['router'].urls = _router);
  return http.createServer(new Middleware.makeFlaker(_middlewares));
}