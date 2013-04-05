/**
 * Middleware system inspired by Connect
 */

/**
 * Module dependencies
 */

var Klass = require('./klass').Klass;
var Chain = require('./control').Chain;
var EventEmitter = require('events').EventEmitter;
var Path = require('path');
var toArray = require('./util').toArray;
var App = require('./app').App;
var Context = require('./context').Context;
var extend = require('./util').extend;

/**
 * The middleware management class
 *
 * @param [site] {Object} Optional Site instance object
 * @constructor
 * @public
 */

var Core = Klass(Chain, {

  /**
   * Constructor class
   *
   * @param [site] {Object} Optional Site instance object
   * @constructor
   * @public
   */

  init: function (site) {
    this.site = site;
    this.plugins = [];
    this.stackNames = [];
    this.stacks = {};
    this.apps = {};
    this.routes = {};
  },

  /**
   * Get the "writeHead" functions chain
   *
   * @returns {Function}
   * @private
   */

  writeHead: function () {
    this.add('writeHead', function (statusCode, headers) {
      this.response.writeHead(statusCode, headers);
    });
    // return the stacked callbacks
    return this.get('writeHead');
  },

  /**
   * Get the "write" functions chain
   *
   * @returns {Function}
   * @private
   */

  write: function () {
    this.add('write', function (chunk, encoding) {
      if (!this._headerSent) {
        this.writeHead();
      }
      this.response.write(chunk, encoding);
    });
    return this.get('write');
  },

  /**
   * Get the "end" functions chain
   *
   * @returns {Function}
   * @private
   */

  end: function () {
    this.add('end', function (chunk, encoding) {
      if (!this._headerSent) {
        this.writeHead();
      }
      this.response.end(chunk, encoding);
    });
    return this.get('end');
  },

  /**
   * Load a plugin and push to stack or extend as module
   *
   * @param plugin {String|Object} The name string of the built-in plugin or the plugin object
   * @param [options] {Object} Optional plugin options
   * @public
   */

  use: function (plugin, options) {
    if ('string' === typeof plugin) {
      plugin = require(Path.join(__dirname, '/plugin', plugin.toLowerCase()));
    }

    var pluginName = plugin.name;

    if (this.plugins.indexOf(pluginName) > -1) {
      throw new Error('Duplicated plugin name: ' + pluginName);
    }

    this.plugins.push(pluginName);

    if (plugin.attach) {
      var fn = plugin.attach(this, options);
      if ('function' === typeof fn) {
        this.stackNames.push(pluginName);
        this.stacks[pluginName] = fn;
      }
    }

    if (plugin.module) {
      Context = Context(plugin.module);
    }
    return this;
  },

  /**
   *
   * @param app
   * @public
   */
  load: function (app) {
    this.apps[app.name.toLowerCase()] = app;
    return this;
  },

  /**
   *
   * @param routes
   * @returns {*}
   * @public
   */
  map: function (routes) {
    extend(this.routes, routes);
    return this;
  },

  /**
   * Map methods of app to routes and add normalized routes to router
   *
   * @private
   */

  buildRoutes: function () {
    if (!this.router) {
      this.use('router');
    }

    var self = this;
    var router = this.router;
    var routes = this.routes;
    var apps = this.apps;

    Object.keys(apps).forEach(function (appName) {
      var _app = apps[appName];
      var publicMethods = _app.publicMethods;
      Object.keys(publicMethods).forEach(function (name) {
        var routeName = appName + name[0].toUpperCase() + name.slice(1);
        var route = self.normalizeRoute(routeName, routes, apps);
        if (route) {
          router.add(route.method, route.url, route.handler, route.hooks);
          delete routes[route.name];
        }
      });
    });

    Object.keys(routes).forEach(function (routeName) {
      var route = self.normalizeRoute(routeName, routes, apps);
      if (route) {
        router.add(route.method, route.url, route.handler, route.hooks);
        delete routes[route.name];
      }
    });
  },

  /**
   * Normalize route and generate default settings based on route name, app or provided routes
   *
   * @param routeName {String} Name of the route, if app supplied this should be name of the app function
   * @param routes {Object} The routes definition object
   * @param [apps] {Object} Optional object of app instances
   * @returns {Object|Boolean}
   * @private
   */

  normalizeRoute: function (routeName, routes, apps) {
    var router = this.router;
    var self = this;
    var defaultViewPath = router.slashCamelCase(routeName);
    var appName = defaultViewPath.split('/')[0];
    if (routeName === appName) {
      return false;
    }

    var app;
    var appFn;

    if (apps) {
      app = apps[appName];
      if (app) {
        var methodName = routeName.replace(appName, '');
        methodName = methodName[0].toLowerCase() + methodName.slice(1);
        appFn = app.publicMethods[methodName];
      }
    }

    var route = routes[routeName] || {};
    route.name = routeName;

    defaultViewPath = defaultViewPath.split('/');
    defaultViewPath.shift();
    defaultViewPath = appName + '/' + defaultViewPath.join('_');
    defaultViewPath += '.html';

    var appRouteDefaults = routes[appName] || {};

    if (!route.method) {
      route.method = appRouteDefaults.method || 'GET';
    }

    if (!route.url) {
      route.url = router.slashCamelCase(routeName);
    }

    if (appRouteDefaults.urlRoot && route.url[0] !== '^') {
      route.url = route.url.split('/');
      route.url.shift();
      route.url = router.prefixUrl(appRouteDefaults.urlRoot, route.url.join('/'));
    }

    if (!route.view) {
      if (self.view) {
        route.view = defaultViewPath;
      } else {
        route.view = 'html';
      }
    }

    switch (route.view) {
      case 'html':
        route.view = function (err, result) {
          if (err) {
            this.error(err);
            return;
          }
          this.sendHTML(result || '');
        };
        break;
      case 'json':
        route.view = function (err, result) {
          if (err) {
            this.error(err);
            return;
          }
          this.sendJSON(result || '{}');
        };
        break;
    }

    if (self.view && 'string' === typeof route.view) {
      defaultViewPath = route.view;
      route.view = function (err, result) {
        if (err) {
          this.error(err);
          return;
        }
        this.render(result);
      };
    }

    if (!route.handler) {
      if (app && appFn) {
        route.handler = function (context) {
          var next;
          var args = toArray(arguments);
          context.app = app;

          function callback() {
            if (self.view) {
              context.view = self.view;
              context.viewPath = defaultViewPath;
            }
            route.view.apply(context, arguments);
            if (next) {
              next();
            }
          }

          if (context.session) {
            args[0] = context.session;
          } else {
            args.shift();
          }

          if ('function' === typeof args[args.length - 1]) {
            next = args.pop();
          }

          args.push(callback);
          appFn.apply(app, args);
        };
      } else {
        route.handler = function (context) {
          if (app) {
            context.app = app;
          }
          if (self.view) {
            context.view = self.view;
            context.viewPath = defaultViewPath;
          }
          var args = toArray(arguments);
          args[0] = null;
          route.view.apply(context, args);
          return true;
        };
      }
    } else if (app) {
      var handler = route.handler;
      route.handler = function (context) {
        context.app = app;
        handler.apply(null, arguments);
      };
    }

    if (appRouteDefaults && appRouteDefaults.hooks) {
      if (route.hooks) {
        route.hooks = router.stackHook(appRouteDefaults.hooks, route.hooks);
      } else {
        route.hooks = appRouteDefaults.hooks.slice(0);
      }
    }

    return route;
  },

  /**
   * Get the listener which can handle "request" event
   *
   * @returns {Function}
   * @public
   */

  getListener: function () {
    this.buildRoutes();
    var stacks = this.stacks;
    var stackNames = this.stackNames;

    function go(idx, ctx, request, response, where, jumping) {
      var curr;
      if ('undefined' === typeof where) {
        curr = stacks[stackNames[idx++]];
        if (!curr) {
          return;
        }
      } else {
        var whereIdx = stackNames.indexOf(where);
        if (whereIdx > -1) {
          curr = stacks[where];
          if (jumping) {
            idx = whereIdx + 1;
          }
        } else {
          throw new Error('Undefined plugin: ' + where);
        }
      }

      curr.call(ctx, request, response, function (where, jumping) {
        go(idx, ctx, request, response, where, jumping);
      });
    }

    var writeHead = this.writeHead();
    var write = this.write();
    var end = this.end();

    Context = Context({
      writeHead: function (statusCode, headers) {
        this._headerSent = true;
        writeHead.call(this, statusCode || this.statusCode, extend(this._headers, headers));
        return this;
      },
      write: function (chunk, encoding) {
        write.call(this, chunk, encoding);
        return this;
      },
      end: function (chunk, encoding) {
        end.call(this, chunk, encoding);
        return this;
      }
    });

    if (this.site) {
      var site = this.site;
      Context = Context({
        set: function () {
          return site.set.apply(site, arguments);
        },
        get: function () {
          return site.get.apply(site, arguments);
        }
      });
    }

    return function (request, response) {
      var ctx = new Context(request, response);
      go(0, ctx, request, response);
    };
  }
});

/**
 * Expose Core
 *
 * @type {Function}
 */

exports.Core = Core;