// inspired http://www.tornadoweb.org/ (tornado.web.RequestHandler)

var Event = require("../core/event").Event,
sys = require("sys"),
mime = require("./mime"),
extname = require("path").extname,
fs = require("fs");

var Handler = Event({
    init: function(request, response) {
        // call parent init
        this._super();
        this.url = request.url;
        this.method = request.method;
        this.request = request;
        this.response = response;
        // headers of resquest
        this.headers = request.headers;
        // cookies and headers for response
        this._cookies = [];
        this._headers = {};
        this._statusCode = 200;
        this._headersWritten = false;
        this._onDataCalled = false;
    },

    _onData: function(chunked) {
        if (this._onDataCalled || this.method === "GET" || this.method === "HEAD") return;
        this._onDataCalled = true;// for MixedHandler
        var data = '';
        var self = this;
        this.request.addListener("data",
            function(chunk) {
                data += chunk;
                chunked && self.fire("data", chunk);
            });
        this.request.addListener("end",
            function() {
                self.fire("data_end", data);
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
        return this.cookies[name] || null;
    },

    clearCookie: function(name, options) {
        options = options || {};
        options.expires = new Date( + new Date - 30 * 24 * 60 * 60 * 1000);
        this.setCookie(name, "", options);
    },

    setStatus: function(code) {
        this._statusCode = code;
    },

    setHeader: function(key, value) {
        this._headers[key] = value; // old value will be overwritten
    },

    sendHeader: function(code, headers) {
        if (this._headersWritten) {
            // @todo do something here (throw exception or logging)
            return;
        }
        // `headers' will overwrite `this._headers', but cookies will be kept if any.
        this._headers = headers || this._headers;
        // check if we have cookie attached
        if (this._cookies.length > 0) {
            this._cookies.forEach(function(cookie, idx) {
                this.setHeader("_cookie_" + idx, ["Set-Cookie", cookie]);
            },
            this);
        }
        this.response.writeHead(code || this._statusCode, this._headers);
        this._headersWritten = true;
        this.method === "HEAD" && this.finish();
    },

    error: function(code) {
        code = code || 500;
        var message =this.getErrorHTML(code);
        this.sendHeader(code, {
            "Content-Type": "text/html; charset=UTF-8",
            "Content-Length": message.length
        });
        this.response.write(message, "utf8");
        this.finish();
    },

    getErrorHTML: function(code) {
        return "Response status " + code + ": please override getErrorHTML to implement custom error pages.";
    },

    redirect: function(url, permanent) {
        this._cookies = [];
        this.sendHeader(permanent ? 301 : 302, {
            "Location": url
        });
        this.finish();
    },
    
    finish: function() {
        this.response.close();
    }
});

var Simple = {
    init: function(request, response) {
        this._super(request, response);
        this._onData(false);
    },

    send: function(body, code, headers) {
        headers && typeof headers === "object" && Object.keys(headers).forEach(function(name) {
            this.setHeader(name, headers[name]);
        }, this);
        body = typeof body === "string" ? body : JSON.stringify(body);
        this.setHeader("Content-Length", body.length);
        this.sendHeader(code || this._statusCode);
        this.response.write(body, "utf8");
        this.finish();
    },

    staticFile: function(path, type) {
        // this should not be used in production env.
        var self = this;
        fs.readFile(path, function(err, content) {
            if (err) {
                self.error(404);
                return;
            }
            self.send(content, 200, {
                "Content-Type": type || mime.lookup(extname(path))
            });
        });
    }
}

var Stream = {

    init: function(request, response) {
        this._super(request, response);
        this._onData(true);
    },

    _write: function(data, buffer) {
        // @todo send header if necessary
        data = typeof data === "string" ? data : JSON.stringify(data);
        buffer ? this._writeBuffer.push(data) : this.response.write(data, "utf8");
    },

    write: function(data) {
        this._write(data);
    },

    buffer: function(data) {
        this._write(data, true);
    },

    flush: function(data) {
        data && this._write(data, true);
        this._write(this._writeBuffer.join());
    }
}

exports.SimpleHandler = Handler(Simple);
exports.StreamHandler = Handler(Stream);
exports.MixedHandler = exports.SimpleHandler(Stream);