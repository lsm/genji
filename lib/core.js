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
var util = require('./util');
var toArray = util.toArray;
var Context = require('./context').Context;
var extend = util.extend;
var Injector = util.Injector;
var http = require('http');


/**
 * The middleware management class
 *
 * @constructor
 * @public
 */

var Core = function () {
  EventEmitter.call(this);
  this.plugins = [];
  this.stackNames = [];
  this.stacks = {};
  this.chain = new Chain();
  var injector = new Injector();
  this.injector = injector;
  injector.regDependency('core', this);
  injector.reflect(injector, ['regDependency', 'getDependency'], this);
  injector.reflect(this.chain, [['add', 'addChain'], ['get', 'getChain']], this);
};

Core.prototype = {

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
   * Get the listener function which can handle "request" event
   *
   * @returns {Function}
   * @public
   */

  getListener: function () {
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
        writeHead.call(this, statusCode, headers);
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

    return function (request, response) {
      var ctx = new Context(request, response);
      ctx.injector.mergeInjector(self.injector);
      go(0, ctx, request, response);
    };
  },

  /**
   * Create and start the http server using settings of current env
   *
   * @param [server] {Object} Optional HttpServer instance
   * @returns {Object} HttpServer instance
   * @public
   */

  start: function (server) {
    var listener = this.getListener();
    if (server) {
      server.on('request', listener);
    } else {
      server = http.createServer(listener);
      server.listen(process.env['PORT'] || 8888, process.env['HOST'] || '127.0.0.1');
    }
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