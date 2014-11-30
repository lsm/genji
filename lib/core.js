"use strict";
/**
 * Middleware system inspired by Connect
 */

/**
 * Module dependencies
 */

var util = require('./util');
var Klass = util.Klass;
var Chain = require('./control').Chain;
var EventEmitter = require('events').EventEmitter;
var Path = require('path');
var toArray = util.toArray;
var Context = require('./context').Context;
var extend = util.extend;
var Injector = util.Injector;
var delegate = util.delegate;
var http = require('http');
var RE_FN_NAME = /^function\s*(\S+)\(/;


/**
 * The middleware management class
 *
 * @constructor
 * @public
 */

var Core = function () {
  EventEmitter.call(this);
  this.plugins = {};
  this.stackNames = [];
  this.stacks = {};
  this.inits = null;
  this.chain = new Chain();

  // Dependency Injection
  var injector = new Injector();
  this.injector = injector;
  injector.regDependency('core', this);

  // Delegation
  this.delegate = delegate;
  delegate(injector, ['regDependency', 'getDependency'], this);
  delegate(this.chain, [['add', 'addChain'], ['get', 'getChain']], this);
};

Core.prototype = {

  /**
   * Load a plugin and push to stack or extend as module
   *
   * @param plugin {String|Object} The name string of the built-in plugin or the plugin object
   * @param [options] {Object} Optional plugin options
   * @param [index] {Number} Position of the plugin being inserted
   * @public
   */

  use: function (plugin, options, index) {
    if ('string' === typeof plugin) {
      try {
        // try to find the plugin from built-in plugin directory first
        plugin = require(Path.join(__dirname, '/plugin', plugin.toLowerCase()));
      } catch(e) {
        // if failed, try to find the plugin relative to the directory where this funcion being called.
        var lines = e.stack.split('\n');
        var re = new RegExp('genji\/lib\/core\.js');
        var calleeFilename;
        lines.some(function (line, ln) {
          if (re.test(line)) {
            calleeFilename = lines[ln + 1];
          }
        });
        var matched = calleeFilename.match(/\({1}(\S+\.js)/)[1];
        if (matched) {
          var dirname = Path.dirname(matched);
          plugin = require(Path.join(dirname, plugin.toLowerCase()));
        }
      }
    }

    if (typeof plugin === 'function') {
      var matched = plugin.toString().match(RE_FN_NAME);
      if (matched && matched[1]) {
        var attach = plugin;
        plugin = {
          name: matched[1],
          attach: attach
        }
      } else {
        throw new Error('Please name your plugin function: \n' + plugin.toString());
      }
    }

    plugin.options = options;

    if (this.plugins.hasOwnProperty(plugin.name)) {
      throw new Error('Duplicated plugin name: ' + plugin.name);
    }

    this.plugins[plugin.name] = plugin;

    if (plugin.attach) {
      var fn = plugin.attach(this, plugin.options);
      if ('function' === typeof fn) {
        if (undefined !== index) {
          this.stackNames.splice(index, 0, plugin.name);
        } else {
          this.stackNames.push(plugin.name);
        }
        this.stacks[plugin.name] = fn;
      }
    }

    if (plugin.module) {
      Context = Context(plugin.module);
    }

    if (plugin.init) {
      this.initNames = this.initNames || [];
      if (undefined !== index) {
        this.initNames.splice(index, 0, plugin.name);
      } else {
        this.initNames.push(plugin.name);
      }
    }

    return this;
  },

  /**
   * Add plugin before the specific plugin.
   *
   */

  before: function (refPluginName, plugin, options) {
    var idx = this.stackNames.indexOf(refPluginName);
    this.use(plugin, options, idx);
  },

  /**
   * Get the listener function which can handle "request" event
   *
   * @returns {Function}
   * @public
   */

  getListener: function (callback) {
    var self = this;
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

    var writeHead = this.addChain('writeHead', Context.prototype.writeHead).getChain('writeHead');
    var write = this.addChain('write', Context.prototype.write).getChain('write');
    var end = this.addChain('end', Context.prototype.end).getChain('end');

    Context = Context({
      writeHead: function (statusCode, headers) {
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

    var listener = function (request, response) {
      var ctx = new Context(request, response);
      ctx.injector.mergeInjector(self.injector);
      go(0, ctx, request, response);
    };

    if (this.initNames) {
      var _init = function() {
        var initName = self.initNames.pop();
        if (!initName) {
          self.emit('listenReady');
          callback(listener);
          return;
        }
        var plugin = self.plugins[initName];
        plugin.init(self, plugin.options, _init);
      }
      _init();
    } else {
      self.emit('listenReady');
      callback(listener);
    }
  },

  /**
   * Create and start the http server using settings of current env
   *
   * @param [server] {Object} Optional HttpServer instance
   * @returns {Object} HttpServer instance
   * @public
   */

  start: function (server) {
    var listenFn;
    if (server) {
      this.getListener(function (listener) {
        listenFn = listener;
      });
    } else {
      server = http.createServer();
      this.getListener(function (listener) {
        listenFn = listener;
        server.listen(process.env.PORT || 8888, process.env.HOST || '127.0.0.1');
      });
    }
    server.on('request', function (req, res) {
      listenFn && listenFn.call(server, req, res);
    });
    this.injector.regDependency('server', server);
    return server;
  }
};

/**
 * Expose Core
 *
 * @type {Function}
 */

exports.Core = Klass(EventEmitter, Core);