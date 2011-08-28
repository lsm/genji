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
          _url.pathname += options.path;
        }
        delete options.path;
        var path = _url.pathname + (_url.search || '');
        if (options.method && ['POST', 'PUT'].indexOf(options.method) > -1) {
          // a `POST` or `PUT` request, convert `options.params` to request body
          options.data = JSON.stringify(options.params);
        } else {
          // otherwise convert to url query strings
          path += options.params ? (_url.search ? '&' : '?') + querystring.stringify(options.params) : '';
        }
        delete options.params;
        var defaultOptions = {
          host: _url.hostname,
          port: _url.port || (_url.protocol === 'https:' ? 443 : 80),
          method: 'GET',
          path: path
        };
        options = extend(defaultOptions, options);
        options.headers = extend({'Host': _url.hostname}, options.headers);
        if (options.data) {
          options.headers['Content-Length'] = Buffer.byteLength(options.data, 'utf8');
        }

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
        if (options.data) {
          request.write(options.data);
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