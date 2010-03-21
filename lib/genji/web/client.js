/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var Event = require("../core/event").Event;
var http = require("http");
//var d = require('../utils').debug;

exports.HttpSimple = Event({
	init: function(host, port, encoding, type) {
		this._super();
		this._client = http.createClient(port || 80, host || "127.0.0.1");
		this._encoding = encoding || "utf8";
		this._content_type = type || "text/plain";
	},

	// @todo error handling
	_request: function(method, url, callback, options) {
		var self;
        options = options || {};
		options.headers = options.headers || {};
		if (options.body) {
			if (!options.headers.hasOwnProperty("Content-Length")) {
				options.headers["Content-Length"] = options.body.length;
			}
			if (!options.headers.hasOwnProperty("Content-Type")) {
				options.headers["Content-Type"] = this._content_type;
			}
		}

		var req = this._client.request(method, url, options.headers);
		if (options.body) req.write(options.body, options.encoding || this._encoding);
		callback && (self = this) && req.addListener("response", function(response) {
			var responseBody = "";
			response.setBodyEncoding(options.encoding || this._encoding);
			response.addListener("data", function(chunk) {
				responseBody += chunk;
			});
			response.addListener("end", function() {
				if (options.format) {
					try {
						responseBody = options.format(responseBody);
					} catch(e) {
						self.fire("error", e);
					}
				}
				self.callOrFire(callback, response.statusCode, response.headers, responseBody);
			});
		});
		req.close();
	},

	get: function(url, callback, options) {
		this._request("GET", url, callback, options);
	},
	
	post: function(url, callback, options) {
		this._request("POST", url, callback, options);
	},

	put: function(url, callback, options) {
		this._request("PUT", url, callback, options);
	},

	del: function(url, callback, options) {
		this._request("DELETE", url, callback, options);
	}
});

/* vim:tabstop=4:expandtab:sw=4:softtabstop=4
*/