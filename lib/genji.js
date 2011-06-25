
// Global private variables
var _apps = {};
var _middlewares = {};
var _router;
var _defaultApp = '_defaultApp';


// Public apis

function app(name, options) {
  var App = require('./app').App;
  name = name || _defaultApp;
  if (_apps[name] instanceof App) {
    return _apps[name];
  }
  if (!_router) {
    var Router = require('./router').Router;
    var SimpleHandler = require('./handler').SimpleHandler;
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

function import(module) {
  return require('./' + module);
}

function short() {
  var util = require('./util');
  var extend = util.extend;
  // extends submodules to the `genji` namespace
  extend(exports, util);
  extend(exports, {Base: require('./base')});
  extend(exports, require('./control'));
  delete exports['short'];
  return exports;
}

function createServer() {
  if (_router) {
    Object.keys(_apps).forEach(function(name) {
      _router.mount(_apps[name].toRoutes());
    });
    _middlewares['router'].urls = _router
  }
  var http = require('http');
  var Middleware = require('./middleware');
  return http.createServer(Middleware(_middlewares));
}

exports.app = app;
exports.use = use;
exports.require = import;
exports.short = short;
exports.createServer = createServer;