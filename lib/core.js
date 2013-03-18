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
 * The constructor of context class
 *
 * @param request {http.IncomingMessage}
 * @param response {http.ServerResponse}
 * @constructor
 * @public
 */

function Context(request, response) {
  EventEmitter.call(this);
  this.request = request;
  this.response = response;
  this.response.statusCode = 200;
}

/**
 * Context prototype object
 *
 * @type {Object}
 */

Context.prototype = {

  /**
   * Send a response headers to client
   *
   * @param [statusCode] {Number|String} 3-digit HTTP status code, default is 200
   * @param [headers] {Object} Optional headers object
   * @public
   */

  writeHead: function (statusCode, headers) {
    this.response.writeHead(statusCode || this.response.statusCode, headers);
  },

  /**
   * Send a chunk of response body to client
   *
   * @param chunk {String|Buffer} Data of chunk
   * @param [encoding] {String} Encoding string, defaults to 'utf8'
   * @public
   */

  write: function (chunk, encoding) {
    this.response.write(chunk, encoding);
  },

  /**
   * Finish the response process with optional data
   *
   * @param [data] {String|Buffer} Data to send
   * @param [encoding] {String} Encoding string, defaults to 'utf8'
   * @public
   */

  end: function (data, encoding) {
    this.response.end(data, encoding);
  },

  /**
   * ServerResponse.setHeader
   *
   * @param key {String} Key of the header
   * @param value {*} Value of the header
   * @returns {Object} "this"
   * @public
   */

  setHeader: function (key, value) {
    this.response.setHeader(key, value);
    return this;
  },

  /**
   * ServerResponse.getHeader
   *
   * @param key {String} Key of the header
   * @returns {*} Value of the header if any
   * @public
   */

  getHeader: function (key) {
    return this.response.getHeader(key);
  },

  /**
   * Check if the given key is setted in header
   *
   * @param key {String} Key of the header
   * @returns {boolean}
   * @public
   */

  hasHeader: function (key) {
    return !!this.getHeader(key);
  },

  /**
   * Add the header if it's not setted
   *
   * @param key {String} Key of the header
   * @param value {*} Value of the header
   * @returns {Object} "this"
   * @public
   */

  addHeader: function (key, value) {
    if (!this.hasHeader(key)) {
      this.setHeader(key, value);
    }
    return this;
  },

  /**
   * Set the HTTP status code for response
   *
   * @param code {Number|String} 3-digit HTTP status code
   * @returns {Object} "this"
   * @public
   */

  setStatusCode: function (code) {
    this.response.statusCode = code;
    return this;
  },

  /**
   * Redirect to given url permanently or not
   *
   * @param url {String} Url of redirection
   * @param [permanent] {Boolean} Indicate the permanence of the redirection
   * @public
   */

  redirect: function (url, permanent) {
    this.setStatusCode(permanent ? 301 : 302);
    this.setHeader("Location", url).end();
  },

  /**
   *  Send response to client in one operation
   *
   * @param {String|Object} body Body of the http response
   * @param {Number} [code] Http response status code, default `200`
   * @param {Object} [headers] Http response headers, default `Content-Type, text/plain;`
   * @param {String} [encoding] default 'utf8'
   * @public
   */

  send: function (body, code, headers, encoding) {
    if (typeof body !== 'string') {
      body = JSON.stringify(body) || "";
    }
    this.addHeader("Content-Length", Buffer.byteLength(body, encoding || 'utf8'));
    this.addHeader("Content-Type", 'text/plain');
    this.writeHead(code, headers);
    this.end(body, encoding);
  },

  /**
   * Send data as JSON
   *
   * @param data {String|Object} Data as a JSON string or object
   * @public
   */

  sendJSON: function (data) {
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.send(data);
  },

  /**
   * Send data as HTML text
   *
   * @param data {String} String of data
   * @public
   */

  sendHTML: function (data) {
    this.setHeader('Content-Type', 'text/html; charset=utf-8');
    this.send(data);
  }
};

/**
 * Expose Context class
 *
 * @type {Function}
 */

var Context = exports.Context = Klass(EventEmitter, Context);

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
      statusCode = statusCode || this.response.statusCode;
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
      }
    });

    return function (request, response) {
      var ctx = new Context(request, response);
      go(0, ctx, request, response);
    };
  }
});

exports.Core = Core;