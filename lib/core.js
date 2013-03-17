/**
 * Middleware system inspired by Connect
 */

/**
 * Module dependencies
 */

var Klass = require('./base').Klass;
var Chain = require('./control').Chain;
var EventEmitter = require('events').EventEmitter;
var Path = require('path');

/**
 * The request context class
 *
 * @private
 */

var Context = Klass(function (request, response) {
  this.request = request;
  this.response = response;
});

/**
 * The middleware management class
 *
 * @param emitter {Object} An EventEmitter instance use to emit event from core or context
 * @constructor
 * @public
 */

var Core = Klass(Chain, {

  /**
   * Constructor class
   *
   * @param emitter {Object} An EventEmitter instance use to emit event from core or context
   * @constructor
   * @public
   */

  init: function (emitter) {
    this.emitter = emitter;
    this.plugins = [];
    this.stackNames = [];
    this.stacks = {};
  },

  /**
   * Get the "writeHead" functions chain
   *
   * @returns {Function}
   */

  writeHead: function () {
    this.add('writeHead', function (statusCode, headers) {
      // the final chain which writes to the response
      this._statusCode = statusCode;
      this.response.writeHead(statusCode, headers);
    });
    // return the stacked callbacks
    return this.get('writeHead');
  },

  /**
   * Get the "write" functions chain
   *
   * @returns {Function}
   */

  write: function () {
    this.add('write', function (chunk, encoding) {
      this.response.write(chunk, encoding);
    });
    return this.get('write');
  },

  /**
   * Get the "end" functions chain
   *
   * @returns {Function}
   */

  end: function () {
    this.add('end', function (chunk, encoding) {
      this.response.end(chunk, encoding);
    });
    return this.get('end');
  },

  /**
   * Load a plugin and push to stack or extend as module
   *
   * @param plugin {String|Object} The name string of the built-in plugin or the plugin object
   * @param [options] {Object} Optional plugin options
   */

  loadPlugin: function (plugin, options) {
    if ('string' === typeof plugin) {
      plugin = require(Path.join(__dirname, '/plugin', plugin));
    }

    var pluginName = plugin.name;

    if (this.plugins.indexOf(pluginName) > -1) {
      throw new Error('Duplicated plugin name: ' + pluginName);
    }

    this.plugins.push(pluginName);
    var fn = plugin.attach(this, options);

    switch (typeof fn) {
      case 'function':
        this.stackNames.push(pluginName);
        this.stacks[pluginName] = fn;
        break;
      case 'object':
        Context = Context(fn);
        break;
    }
  },

  /**
   * Get the listener which can handle "request" event
   *
   * @returns {Function}
   */

  getListener: function () {
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
    var emitter = this.emitter;

    Context = Context({
      writeHead: function (statusCode, headers) {
        headers = headers || {};
        writeHead.call(this, statusCode, headers);
      },
      write: function (chunk, encoding) {
        write.call(this, chunk, encoding);
      },
      end: function (chunk, encoding) {
        end.call(this, chunk, encoding);
      },
      emit: function () {
        emitter.emit.apply(emitter, arguments);
      }
    });

    return function (request, response) {
      var ctx = new Context(request, response);
      go(0, ctx, request, response);
    };
  }
});

exports.Core = Core;