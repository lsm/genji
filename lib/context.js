/**
 * Request/response context for Router and Core
 */

/**
 * Module dependencies
 */

var Klass = require('./klass').Klass;
var EventEmitter = require('events').EventEmitter;
var extend = require('./util').extend;

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
  this.statusCode = 200;
  this._headers = {};
  this._headerSent = false;
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
    this._headerSent = true;
    this.response.writeHead(statusCode || this.statusCode, extend(this._headers, headers));
    return this;
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
    return this;
  },

  /**
   * Finish the response process with optional data
   *
   * @param [data] {String|Buffer} Data to send
   * @param [encoding] {String} Encoding string, defaults to 'utf8'
   * @public
   */

  end: function (data, encoding) {
    if (!this._headerSent) {
      this.writeHead(this.statusCode, this._headers);
    }
    this.response.end(data, encoding);
    return this;
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
    this._headers[key] = value;
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
    return this._headers[key];
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
   * ServerResponse.removeHeader
   *
   * @param key {String} Key of the header
   * @returns {Object} "this"
   * @public
   */

  removeHeader: function (key) {
    delete this._headers[key];
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
    this.statusCode = code;
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
    this.setHeader('Location', url);
    this.end();
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
  },

  /**
   * Default error handling function, please override
   *
   * @param err {Object|String} Error object
   * @public
   */

  error: function (err) {
    var msg = err.message || err.stack;
    this.send(msg, err.statusCode || 500);
  }
};

/**
 * Expose Context class
 *
 * @type {Function}
 */

exports.Context = Klass(EventEmitter, Context);