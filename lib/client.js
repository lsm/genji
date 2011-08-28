var defer = require("./control").defer,
    Base = require("./base"),
    extend = require('./util').extend,
    http = require('http'),
    https = require('https'),
    url = require('url'),
    querystring = require('querystring');


var Client = Base(function(baseUrl) {
      this._url = url.parse(baseUrl);
      this.request_ = defer(this._request, this);
    }, {
      _request: function(options, callback) {
        var _url = extend({}, this._url);
        // combine path with baseurl
        if (options.path) {
          // make sure no double slash
          if (options.path.slice(0, 1) === '/' && _url.pathname.slice(-1) === '/') {
            _url.pathname = _url.pathname.slice(0, -1);
          }
          _url.pathname += options.path;
        }
        delete options.path;
        var path = _url.pathname + (_url.search || '');
        var params = options.params;
        delete options.params;
        
        var defaultOptions = {
          host: _url.hostname,
          port: _url.port || (_url.protocol === 'https:' ? 443 : 80),
          method: 'GET'
        };
        options = extend(defaultOptions, options);
        var headers = extend({'Host': _url.hostname}, options.headers);
        var data;
        
        if (params) {
          if (options.method === 'GET') {
            path += (_url.search ? '&' : '?') + querystring.stringify(params);
          } else {
            if (headers['Content-Type'] === 'application/json') {
              data = JSON.stringify(params);
            } else {
              data = querystring.stringify(params);
            }
          }
        }
                
        if (data) {
          headers['Content-Length'] = Buffer.byteLength(data, 'utf8');
        }

        options.path = path;
        options.headers = headers;

        var _http = _url.protocol === 'https:' ? https : http;
        var request = _http.request(options, function(response) {
          var length = response.headers['content-length'];
          var buff = new Buffer(parseInt(length, 10));
          var offset = 0;
          response.on('data', function (chunk) {
            chunk.copy(buff, offset);
            offset += chunk.length;
          });
          response.on('end', function() {
            callback && callback(null, buff, response);
          });
        });
        request.on('error', function(err) {
          callback && callback(err);
        });
        if (data) {
          request.write(data);
        }
        request.end();
      },

      get: function(path, params, headers) {
        return this.request_({method: 'GET', path: path, params: params, headers: headers});
      },

      post: function(path, params, headers) {
        return this.request_({method: 'POST', path: path, params: params, headers: headers});
      },

      put: function(path, params, headers) {
        return this.request_({method: 'PUT', path: path, params: params, headers: headers});
      },

      del: function(path, params, headers) {
        return this.request_({method: 'DELETE', path: path, params: params, headers: headers});
      }
    });

var APIClient = Client({
  call_: function(method, endpoint, orderedParams, namedParams, headers) {
    var options = {
      method: method,
      path: (orderedParams ? endpoint.split('.').concat(orderedParams) : endpoint.split('.')).join('/'),
      params: namedParams,
      headers: headers
    };
    // ensure trailing slash
    if (options.path.slice(-1) !== '/') {
      options.path += '/';
    }
    return this.request_(options);
  },

  get: function(endpoint, orderedParams, namedParams, headers) {
    return this.call_('GET', endpoint, orderedParams, namedParams, headers);
  },

  post: function(endpoint, orderedParams, namedParams, headers) {
    return this.call_('POST', endpoint, orderedParams, namedParams, headers);
  },

  put: function(endpoint, orderedParams, namedParams, headers) {
    return this.call_('PUT', endpoint, orderedParams, namedParams, headers);
  },

  del: function(endpoint, orderedParams, namedParams, headers) {
    return this.call_('DELETE', endpoint, orderedParams, namedParams, headers);
  }
});

module.exports = {
  Client: Client,
  APIClient: APIClient
};