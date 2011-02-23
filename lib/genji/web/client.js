
var deferred = require("../pattern/control").deferred,
Base = require("../pattern/base"),
extend = require('../pattern').extend,
http = require('http'),
url = require('url'),
querystring = require('querystring');



var Client = Base(function(baseUrl) {
    this._url = url.parse(baseUrl);
},{
    _request: function(options, callback) {
        var query = this._url.pathname + (this._url.search || '');
        query += options.params ? (this._url.search ? '&' : '?') + querystring.stringify(options.params) : '';
        delete options.params;
        var defaultOptions = {
            host: this._url.hostname,
            port: this._url.port || 80,
            method: 'GET',
            path: query
        };
        options = extend(defaultOptions, options);
        options.headers = extend({'host': this._url.hostname}, options.headers);
        var request = http.request(options, function(response) {
            var buffer = '';
            response.on('data', function (chunk) {
                buffer += chunk;
            });
            response.on('end', function() {
                callback(null, response, buffer);
            });
        });
        request.end();
    },
    
    get: function(params, headers) {
        return deferred(this._request, this)({method: 'GET', params:params, headers:headers});
    }
});

module.exports = {
    Client: Client
}