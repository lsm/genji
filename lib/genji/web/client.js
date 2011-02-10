
var deferred = require("../pattern/control").deferred,
Base = require("../pattern/base"),
extend = require('../pattern').extend,
http = require('http'),
url = require('url'),
querystring = require('querystring');



var Client = Base(function(baseUrl) {
    var self = this;
    this._url = url.parse(baseUrl);
    this._client = http.createClient(this._url.port || 80, this._url.hostname);
},{
    _request: function(options, callback) {
        var query = this._url.pathname + (this._url.search || ''), client = this._client;
        query += options.params ? (this._url.search ? '&' : '?') + querystring.stringify(options.params) : '';
        options.headers = options.headers || {};
        extend(options.headers, {'host': this._url.hostname});
        var errorHandler = function(err) {
            callback ? callback(err) : console.log(err.stack);
        };
        client.on('error', errorHandler);
        var request = client.request(options.method || 'GET', query, options.headers);
        
        request.end();
        request.on('response', function(response) {
            var buffer = '';
            response.on('data', function (chunk) {
                buffer += chunk;
            });
            response.on('end', function() {
                callback(null, response, buffer);
                client.removeListener('error', errorHandler);
            });
        });
    },
    
    get: function(params, headers) {
        return deferred(this._request, this)({method: 'GET', params:params, headers:headers});
    }
});

module.exports = {
    Client: Client
}