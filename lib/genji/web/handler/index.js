var Base = require("../../pattern/base"),
EventEmitter = require('events').EventEmitter,
Buffer = require('buffer').Buffer,
Simple = require('./simple'),
File = require('./file'),
http = require("http"),
Cookie = require('./cookie'),
maxPostSize = 64*1024;

var Handler = Base(EventEmitter, {
    init: function(context) {
        // call parent init/constructor
        this._super();
        // context of middleware
        this.context = context;
        this.request = context.request;
        this.headers = context.request.headers;
        // cookies and headers for response
        this._headers = {};
        this._cookies = [];
        this.context._statusCode = 200;
        // other settings
        this._onDataCalled = false;
        this._encoding = 'utf8';
    },
    
    _onData: function(chunked) {
        if (this._onDataCalled || this.method === "GET" || this.method === "HEAD") return;
        this._onDataCalled = true;// for MixedHandler
        var data = '';
        var self = this;
        this.request.addListener("data",
            function(chunk) {
                data += chunk;
                if (data.length >= maxPostSize) {
                    self.error(500);
                    self.request.removeAllListeners();
                    return;
                }
                chunked && self.emit("data", chunk);
            });
        this.request.addListener("end",
            function() {
                self.emit("end", data);
            });
    },

    addHeader : function(key, value) {
        if (this.getHeader(key)) return;
        this.setHeader(key, value);
    },

    setHeader : function(key, value) {
        this._headers[key] = value; // old value will be overwritten
        return this;
    },

    getHeader : function(key) {
        return this._headers[key];
    },

    hasHeader : function(key) {
        return this._headers.hasOwnProperty(key);
    },

    sendHeaders: function(code, headers) {
        // `headers' will overwrite `this._headers', but cookies will be kept if any.
        this._headers = headers || this._headers;
        // check if we have cookie attached
        if (this._cookies.length > 0) {
            this.setHeader('Set-Cookie', this._cookies);
        }
        this.context.writeHead(code || this.context._statusCode, this._headers);
        this.request.method === "HEAD" && this.finish();
        return this;
    },

    setStatus : function(code) {
        if (http.STATUS_CODES.hasOwnProperty(code)) {
            this.context._statusCode = code;
            return this;
        }
        throw new Error('Unknown HTTP status code ' + code);
    },

    error : function(code, message) {
        code = code || 500;
        this.context.writeHead(code, {
            "Content-Type": "text/html; charset=UTF-8",
            "Content-Length": message ? Buffer.byteLength(message, 'utf8') : 0
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
            this.context.end(data, encoding || this._encoding);
            return;
        }
        this.context.end();
    }
});

module.exports = {
    Handler: Handler,
    SimpleHandler: Handler(Simple),
    SimpleCookieHandler: Handler(Simple)(Cookie),
    FileHandler: Handler(File)
}