/**
 * Module dependencies
 */

var http = require('http');
var EventEmitter = require('events').EventEmitter;
var Klass = require('./klass').Klass;
var extend = require('./util').extend;
var Core = require('./core').Core;

/**
 * Site constructor function
 *
 * @constructor
 * @private
 */

function Site() {
  EventEmitter.call(this);
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'default';
  }
  this.data = {};
  this.plugins = {};
  this.apps = {};
  this.core = new Core(this);
  this.env();
  this.set({
    host: '127.0.0.1',
    port: 8888
  });
}

/**
 * Site prototype object
 *
 * @type {Object}
 */

Site.prototype = {

  /**
   * Switch between different environments
   *
   * @param [name] {String} Optional env name, default is 'default'
   * @returns {Site}
   * @public
   */

  env: function (name) {
    name = name || 'default';
    if (!this.data[name]) {
      this.data[name] = {};
      this.plugins[name] = {};
      this.apps[name] = {};
    }
    this._env = name;
    return this;
  },

  /**
   * Store a value for a key in current env
   *
   * @param key {String|Object} Key of the value or object of key/value pairs that need to be stored
   * @param value {*} Value that need to be stored
   * @returns {Object} The "this" object
   * @public
   */

  set: function (key, value) {
    return _set(this, this.data, key, value);
  },

  /**
   * Get value for key
   *
   * @param key {String|Array} Key of the value or array of keys
   * @returns {*} Value stored
   * @public
   */

  get: function (key) {
    return _get(this, this.data, key);
  },

  /**
   * Use a plugin in current env
   *
   * @param plugin {String|Object} The name string of the built-in plugin or the plugin object
   * @param [options] {Object} Optional plugin options
   * @returns {Object} The "this" object
   * @public
   */

  use: function (plugin, options) {
    var name = 'string' === typeof plugin ? plugin : plugin.name;
    var _plugin = {
      plugin: plugin,
      options: options
    };

    return _set(this, this.plugins, name, _plugin);
  },

  /**
   * Load an app for current env
   *
   * @param app {Function|Object|Array} App constructor or instance or array of apps
   * @param [options] {Object} Optional options for app constructor or routes if app is an instance object
   * @param [routes] {Object} Optional routes object
   * @returns {Object}
   * @public
   */

  load: function (app, options, routes) {
    if (Array.isArray(app)) {
      var self = this;
      app.forEach(function (_app) {
        self.load(_app, options, routes);
      });
    }

    var name;

    if ('function' === typeof app) {
      name = app.prototype.name;
      if (!routes) {
        routes = options;
      }
    } else {
      name = app.name;
      routes = options;
      options = null;
    }

    var _app = {
      app: app,
      options: options
    };

    this.map(routes);

    return _set(this, this.apps, name, _app);
  },

  map: function (routes) {
    if (routes) {
      var _routes = this.get('routes') || {};
      _routes = extend(_routes, routes);
      this.set('routes', _routes);
    }
    return this;
  },

  /**
   * Process all the plugins with core
   *
   * @private
   */

  usePlugins: function () {
    var plugins = extend({}, this.plugins['default']);
    if (process.env.NODE_ENV && 'default' !== process.env.NODE_ENV) {
      extend(plugins, this.plugins[process.env.NODE_ENV]);
    }

    var core = this.core;
    Object.keys(plugins).forEach(function (name) {
      var plugin = plugins[name];
      core.use(plugin.plugin, plugin.options);
    });
    return this;
  },

  /**
   * Process all apps in current environment.
   *
   * @private
   */

  loadApps: function () {
    var apps = extend({}, this.apps['default']);
    if (process.env.NODE_ENV && 'default' !== process.env.NODE_ENV) {
      apps = extend(apps, this.apps[process.env.NODE_ENV]);
    }

    var defaultAppOptions = this.get('appOptions');
    var self = this;
    var core = self.core;

    Object.keys(apps).forEach(function (k) {
      var appObj = apps[k];
      var appOptions = extend({}, defaultAppOptions, appObj.options);
      var app = appObj.app;
      if ('function' === typeof app) {
        app = new app(appOptions);
      }
      app.delegate = self;
      core.load(app);
    });
    return this;
  },

  mapRoutes: function () {
    var routes = extend({}, this.data['default'].routes);
    if (process.env.NODE_ENV && 'default' !== process.env.NODE_ENV) {
      var dataEnv = this.data[process.env.NODE_ENV];
      routes = dataEnv ? extend(routes, dataEnv.routes) : routes;
    }
    this.core.map(routes);
    return this;
  },

  /**
   * Create and start the http server using settings of current env
   *
   * @param [server] {Object} Optional HttpServer instance
   * @returns {Object} HttpServer instance
   * @public
   */

  start: function (server) {
    this.usePlugins();
    this.loadApps();
    this.mapRoutes();
    var listener = this.core.getListener();
    if (server) {
      server.on('request', listener);
    } else {
      server = http.createServer(listener);
      server.listen(this.get('port'), this.get('host'));
    }
    this.server = server;
    return server;
  }
};

/**
 * Exposes Site
 */

exports.Site = Klass(EventEmitter, Site);

/**
 * Private setter function
 *
 * @param self {Object} The `this` object
 * @param data {Object} Data hash to store values
 * @param key {String|Object} Key of the value or object of key/value pairs that need to be stored
 * @param value {*} Value that need to be stored
 * @returns {Object} Self object
 * @private
 */

function _set(self, data, key, value) {
  var _data = data[self._env];
  if ('object' === typeof key) {
    extend(_data, key);
  } else {
    _data[key] = value;
  }
  return self;
}


/**
 * Private getter function
 *
 * @param self {Object} The `this` object
 * @param data {Object} Data hash to store values
 * @param key {String|Array} Key of the value or array of keys
 * @returns {*} Value stored
 * @private
 */

function _get(self, data, key) {
  if (Array.isArray(key)) {
    var values = {};
    key.forEach(function (k) {
      values[k] = _get(self, data, k);
    });
    return values;
  }
  var _data = data[process.env.NODE_ENV];
  if (!_data || !_data.hasOwnProperty(key)) {
    _data = data['default'];
  }
  return _data[key];
}
