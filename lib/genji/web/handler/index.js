var Event = require("../../core").Event,
Buffer = require('buffer').Buffer,
Simple = require('./simple'),
File = require('./file'),
Upload = require('./upload');

var Handler = Event({
    init: function(request, response, flaker) {
        // call parent init
        this._super();
        this.url = request.url;
        this.method = request.method;
        this.request = request;
        this.response = response;
        // middleware
        this.flaker = this.middleware = flaker;
        // headers of resquest
        this.headers = request.headers;
        if (this.headers.hasOwnProperty('content-type')) {
            this.isMultipart = this.headers['content-type'].search('multipart/form-data') > -1;
        }
        // cookies and headers for response
        this._headers = {};
        this._cookies = [];
        this._statusCode = 200;
        // other settings
        this._onDataCalled = false;
        this._encoding = 'utf8';
    },

    _onData: function(chunked) {
        if (this._onDataCalled || this.method === "GET" || this.method === "HEAD") return;
        this._onDataCalled = true;// for MixedHandler
        if (this.isMultipart) {
            return;
        }
        var data = '';
        var self = this;
        this.request.addListener("data",
            function(chunk) {
                data += chunk;
                chunked && self.emit("data", chunk);
            });
        this.request.addListener("end",
            function() {
                self.emit("end", data);
            });
    },

    setCookie: function(name, value, options) {
        var cookie = name + "=" + value;
        if (options) {
            options.expires && (cookie += "; expires=" + options.expires.toUTCString());
            options.path && (cookie += "; path=" + options.path);
            options.domain && (cookie += "; domain=" + options.domain);
            options.secure && (cookie += "; secure" + options.secure);
            options.httponly && (cookie += "; httponly=" + options.httponly);
        }
        this._cookies.push(cookie);
    },

    getCookie: function(name) {
        if (!this.headers.cookie) return null;
        if (!this.cookies) { // request cookie will be parsed only one time
            this.cookies = {};
            this.headers.cookie.replace(/^ *| *$/g, '').split(/ *; */).map(function(cookie) {
                var parsed = cookie.split(/ *= */);
                this.cookies[parsed[0]] = parsed[1];
            },
            this);
        }
        return this.cookies[name];
    },

    clearCookie: function(name, options) {
        options = options || {};
        options.expires = new Date( + new Date - 30 * 24 * 60 * 60 * 1000);
        this.setCookie(name, "", options);
    },

    addHeader : function(key, value) {
        if (this.getHeader(key)) return;
        this.setHeader(key, value);
    },

    setHeader : function(key, value) {
        this._headers[key.toLowerCase()] = value; // old value will be overwritten
        return this;
    },

    getHeader : function(key) {
        return this._headers[key.toLowerCase()];
    },

    hasHeader : function(key) {
        return this._headers.hasOwnProperty(key.toLowerCase());
    },

    sendHeaders: function(code, headers) {
        // `headers' will overwrite `this._headers', but cookies will be kept if any.
        this._headers = headers || this._headers;
        // check if we have cookie attached
        if (this._cookies.length > 0) {
            this.setHeader('Set-Cookie', this._cookies);
        }
        this.flaker.writeHead(code || this._statusCode, this._headers);
        this.method === "HEAD" && this.finish();
        return this;
    },

    setStatus : function(code) {
        if (http.STATUS_CODES.hasOwnProperty(code)) {
            this._statusCode = code;
            return this;
        }
        throw new Error('Unknown HTTP status code ' + code);
    },

    error : function(code, message) {
        code = code || 500;
        this.flaker.writeHead(code, {
            "Content-Type": "text/html; charset=UTF-8",
            "Content-Length": Buffer.byteLength(message, 'utf8')
        });
        this.finish(message, 'utf8');
    },

    redirect: function(url, permanent) {
        this._cookies = [];
        this.sendHeaders(permanent ? 301 : 302, {
            "Location": url
        }).finish();
    },

    finish: function(data, encoding) {
        if (data) {
            this.response.write(data, encoding || this._encoding);
        }
        this.response.end();
    }
});

module.exports = {
    Handler: Handler,
    SimpleHandler: Handler(Simple),
    FileHandler: Handler(File),
    UploadHandler: Handler(Upload)
}