exports.DEFAULT_APP = '_defaultApp';

exports.App = App;

function App(name, options) {
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

App.prototype._formatPattern = function(pattern) {
  if (pattern[0] === '^') {
    // consider as a full url matching pattern
    return pattern;
  } else if (this._root === '^/' && pattern[0] === '/') {
    return this._root + pattern.slice(1);
  }
  return this._root + pattern;
};

App.prototype.get = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('GET'))
      .pattern(pattern)
      .fn(handleFunction)
      .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.post = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('POST'))
      .pattern(pattern)
      .fn(handleFunction)
      .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.put = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('PUT'))
      .pattern(pattern)
      .fn(handleFunction)
      .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.del = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('DELETE'))
      .pattern(pattern)
      .fn(handleFunction)
      .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.head = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('HEAD'))
      .pattern(pattern)
      .fn(handleFunction)
      .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.notFound = function (pattern, handleFunction, handlerClass, hooks) {
  var appRoute = (new AppRoute('NOTFOUND'))
      .pattern(pattern)
      .fn(handleFunction)
      .handler(handlerClass);
  hooks && appRoute.hook(hooks.pre, hooks.post);
  this._routes.push(appRoute);
  return appRoute;
};

App.prototype.mount = function(routes) {
  this._routes = this._routes.concat(routes);
  return this;
};

App.prototype.toRoutes = function() {
  var routes = [];
  this._routes.forEach(function(route) {
    if (route instanceof AppRoute) {
      route = route.toRoute();
    }
    route[0] = this._formatPattern(route[0]);
    routes.push(route);
  }, this);
  return routes;
};

/**
 * AppRouter
 * 
 * @param method
 */
function AppRoute(method) {
  this._options = {method: method || 'GET'};
}

AppRoute.prototype.get = function(name) {
  return this._options[name];
};

AppRoute.prototype.method = function(method) {
  this._options.method = method;
  return this;
};

AppRoute.prototype.pattern = function(pattern) {
  this._options.pattern = pattern || '';
  return this;
};

AppRoute.prototype.fn = function(fn) {
  this._options.fn = fn;
  return this;
};

AppRoute.prototype.handler = function(handler) {
  this._options.handler = handler;
  return this;
};

AppRoute.prototype.hook = function(pre, post) {
  pre && this.preHook(pre);
  post && this.postHook(post);
  return this;
};

AppRoute.prototype.preHook = function(hooks) {
  if (!Array.isArray(this.get('preHooks'))) {
    this._options.preHooks = [];
  }
  if (!Array.isArray(hooks)) {
    hooks = [hooks];
  }
  this._options.preHooks = this._options.preHooks.concat(hooks);
  return this;
};

AppRoute.prototype.postHook = function(hooks) {
  if (!Array.isArray(this.get('postHooks'))) {
    this._options.postHooks = [];
  }
  if (!Array.isArray(hooks)) {
    hooks = [hooks];
  }
  this._options.postHooks = this._options.postHooks.concat(hooks);
  return this;
};

AppRoute.prototype.getHooks = function() {
  var hooks = {};
  Array.isArray(this.get('preHooks')) && (hooks.pre = this.get('preHooks'));
  Array.isArray(this.get('postHooks')) && (hooks.post = this.get('postHooks'));
  return hooks.pre ? hooks : null;
};

AppRoute.prototype.toRoute = function() {
  return [
    this.get('pattern'),
    this.get('fn'),
    this.get('method'),
    this.get('handler'),
    this.getHooks()
  ];
};

