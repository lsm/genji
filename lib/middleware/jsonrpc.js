/*!
 * Modified base on connect-jsonrpc (https://github.com/visionmedia/connect-jsonrpc)
 *
 * Ext JS Connect 
 * Copyright(c) 2010 Sencha Inc.
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var http = require('http');

/**
 * JSON-RPC version.
 */

var VERSION = exports.VERSION = '2.0';

/**
 * JSON parse error.
 */

var PARSE_ERROR = exports.PARSE_ERROR = -32700;

/**
 * Invalid request due to invalid or missing properties.
 */

var INVALID_REQUEST = exports.INVALID_REQUEST = -32600;

/**
 * Service method does not exist.
 */

var METHOD_NOT_FOUND = exports.METHOD_NOT_FOUND = -32601;

/**
 * Invalid parameters.
 */

var INVALID_PARAMS = exports.INVALID_PARAMS = -32602;

/**
 * Internal JSON-RPC error.
 */

var INTERNAL_ERROR = exports.INTERNAL_ERROR = -32603;

/**
 * Request too large
 */

var REQUEST_SIZE_ERROR = exports.REQUEST_SIZE_ERROR = -32604;

/**
 * Default error messages.
 */

var errorMessages = exports.errorMessages = {};
errorMessages[PARSE_ERROR] = 'Parse Error.';
errorMessages[INVALID_REQUEST] = 'Invalid Request.';
errorMessages[METHOD_NOT_FOUND] = 'Method Not Found.';
errorMessages[INVALID_PARAMS] = 'Invalid Params.';
errorMessages[INTERNAL_ERROR] = 'Internal Error.';
errorMessages[REQUEST_SIZE_ERROR] = 'Request size too large.';

/**
 * Check if the given request is a valid
 * JSON remote procedure call.
 *
 *   - "jsonrpc" must match the supported version ('2.0')
 *   - "id" must be numeric
 *   - "method" must be a string
 *
 * @param  {Object} rpc
 * @return {Boolean}
 * @api private
 */

function validRequest(rpc) {
  return rpc.jsonrpc === VERSION
      && typeof rpc.id === 'number'
      && typeof rpc.method === 'string';
}


exports.name = 'JSONRPC';
exports.make = function(conf) {
  var endpointRe = new RegExp(conf.endpoint),
      providers = conf.providers, flaker = this, maxSize = 128 * 1024;

  function getMethodName(name) {
    return [conf.endpoint, name].join('-');
  }

  // build services from provider array
  providers.forEach(function(provider) {
    var ns = provider.namespace;
    Object.keys(provider.methods).forEach(function(name) {
      var methodName = getMethodName([ns, name].join('.'));
      if (typeof provider.before === 'function') {
        flaker.add(methodName, provider.before);
      }
      flaker.add(methodName, provider.methods[name]);
      if (typeof provider.after === 'function') {
        flaker.add(methodName, provider.after);
      }
    });
  });

  /**
   * Handle JSON-RPC request.
   *
   * @param  {Object} rpc
   * @param  {Function} respond
   */

  function handleRequest(rpc, respond) {
    if (!validRequest(rpc)) {
      respond({
        error: {
          code: INVALID_REQUEST
        }
      });
      return;
    }
    var method = flaker.get(getMethodName(rpc.method));
    if (typeof method !== 'function') {
      respond({
        error: {
          code: METHOD_NOT_FOUND
        }
      });
      return;
    }
    var params = [];
    // Unnamed params
    if (Array.isArray(rpc.params)) {
      params = rpc.params;
      // Named params
    } else if (typeof rpc.params === 'object') {
      var names = method.toString().match(/\((.*?)\)/)[1].match(/[\w]+/g);
      if (names) {
        for (var i = 0, len = names.length - 1; i < len; ++i) {
          params.push(rpc.params[names[i]]);
        }
      } else {
        // Function does not have named parameters
        return respond({
          error: {
            code: INVALID_PARAMS,
            message: 'This service does not support named parameters.'
          }
        });
      }
    }
    // Reply with the given err and result
    function reply(err, result) {
      if (err) {
        if (typeof err === 'number' && errorMessages.hasOwnProperty(err)) {
          respond({
            error: {
              code: err
            }
          });
        } else {
          respond({
            error: {
              code: err.code || INTERNAL_ERROR,
              message: err.message
            }
          });
        }
      } else {
        respond({
          result: result
        });
      }
    }

    // Push reply function as the last argument
    params.push(reply);

    // Invoke the method
    try {
      method.apply(this, params);
    } catch (err) {
      reply(err);
      flaker.emit('error', {exception: err});
    }
  }

  /**
   * Normalize response object.
   */
  function normalize(rpc, obj) {
    obj.id = rpc && typeof rpc.id === 'number'
        ? rpc.id
        : null;
    obj.jsonrpc = VERSION;
    if (obj.error && !obj.error.message) {
      obj.error.message = errorMessages[obj.error.code];
    }
    return obj;
  }

  return function(req, res, go) {
    var me = this,
        contentType = req.headers['content-type'] || '';
    if (req.method !== 'POST' || !endpointRe.exec(req.url) || contentType.indexOf('application/json') === -1) {
      //not a jsonrpc request, go to next step silently
      return go();
    }
    // this is a jsonrpc request, so we don't need `router`
    this.omitRouter = true;
    /**
     * Respond with the given response object.
     */
    function respond(obj) {
      var body = JSON.stringify(obj);
      me.writeHead(200, {
        'Content-Type': 'application/json; charset=utf8',
        'Content-Length': Buffer.byteLength(body)
      });
      me.end(body);
      go();
    }

    var data = '';
    req.setEncoding('utf8');
    req.addListener('data', function(chunk) {
      if (data > maxSize) {
        respond({error: {code: REQUEST_SIZE_ERROR}});
        flaker.emit('error', {code: REQUEST_SIZE_ERROR, message: errorMessages[REQUEST_SIZE_ERROR], request: req});
        return;
      }
      data += chunk;
    });
    req.addListener('end', function() {
      // Attempt to parse incoming JSON string
      try {
        var rpc = JSON.parse(data),
            batch = Array.isArray(rpc);
      } catch (err) {
        respond(normalize(rpc, {
          error: {
            code: PARSE_ERROR
          }
        }));
        flaker.emit('error', {exception: err});
        return;
      }

      // Handle requests

      if (batch) {
        var responses = [],
            len = rpc.length,
            pending = len;
        for (var i = 0; i < len; ++i) {
          (function(rpc) {
            handleRequest.call(me, rpc, function(obj) {
              responses.push(normalize(rpc, obj));
              if (!--pending) {
                respond(responses);
              }
            });
          })(rpc[i]);
        }
      } else {
        handleRequest.call(me, rpc, function(obj) {
          respond(normalize(rpc, obj));
        });
      }
    });
  }
};