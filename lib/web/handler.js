var Event = require("../core/event").Event,
sys = require("sys"),
mime = require("./mime"),
extname = require("path").extname,
fs = require("fs");


exports.Handler = Event({

    init: function(request, response) {
        // call parent init
        this._super();
        this.setup(request, response);
    },

    setup: function(request, response) {
        this.request = request || {};
        this.response = response || {};
        // headers for resquest
        this.headers = this.request.headers;
        // cookies and headers for response
        this._cookies = [];
        this._headers = {};

        this._headers_written = false;

        var data = '';
        this.request.addListener("data",
        function(chunk) {
            data += chunk;
        });
        var self = this;
        this.request.addListener("end",
        function() {
            self.fire("data_received", data);
        });
        return this;
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
        options.expires = new Date( + new Date - 30 * 24 * 60 * 60 * 1000);
        this.setCookie(name, "", options);
    },

    setHeader: function(key, value) {
        this._headers[key] = value; // old value will be overwritten
    },

    sendHeader: function(code, headers) {
        // you can use `headers' to overwrite `this._headers', but cookies will be kept if any.
        this._headers = headers || this._headers;
        // check if we have cookie attached
        if (this._cookies.length > 0) {
            this._cookies.forEach(function(cookie, idx) {
                this.setHeader("_cookie_" + idx, ["Set-Cookie", cookie]);
            },
            this);
        }
        this.response.writeHeader(code, this._headers);
        this._headers_written = true; // @todo do we really need this?
    },
    
    // headers setted by `setHeader' will be overwritten
    send: function(code, headers, body) {
        headers['Content-Length'] = typeof body == "string" ? body.length : JSON.stringify(body).length;
        this.sendHeader(code, headers);
        this.response.write(body);
        this.finish();
    },

    redirect: function(url, permanent) {
        this.setHeader("Location", url);
        this.sendHeader(permanent ? 301 : 302);
        this.finish();
    },

    notFound: function() {
        this.send(404, {"Content-Type": "text/plain"}, "Content not found");
    },
    
    error: function(code, message) {
        this.send(code || 500, {"Content-Type": "text/plain"}, message);
    },

    staticFile: function(path, type, encoding) {
        var self = this;
        fs.open(path, "r" );
        fs.readFile(path, encoding).addListener("", function(content) {
            self.send(200, {"Content-Type": type || mime.lookupExtension(extname(path))}, content);
        }).addErrback(function() {
            this.notFound();
        });
    },

    finish: function() {
        this.response.close();
    }
});

/* vim:tabstop=4:expandtab:sw=4:softtabstop=4
*/