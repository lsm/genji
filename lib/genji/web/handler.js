// inspired http://www.tornadoweb.org/ (tornado.web.RequestHandler)

var Event = require("../core/event").Event,
sys = require("sys"),
mime = require("./mime"),
extname = require("path").extname,
Buffer = require('buffer').Buffer,
path = require('path'),
multipart = require('../../support/multipart-js/lib/multipart'),
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
        if (this.headers.hasOwnProperty('content-type')) {
            this.isMultipart = this.headers['content-type'].search('multipart/form-data') > -1;
        }
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
        if (this.isMultipart) {
            return;
        }
        this.request.addListener("data",
            function(chunk) {
                data += chunk;
                chunked && self.fire("data", chunk);
            });
        this.request.addListener("end",
            function() {
                self.fire("end", data);
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
        return this;
    },

    setHeader: function(key, value) {
        this._headers[key] = value; // old value will be overwritten
        return this;
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
            this.setHeader('Set-Cookie', this._cookies);
        }
        this.response.writeHead(code || this._statusCode, this._headers);
        this._headersWritten = true;
        this.method === "HEAD" && this.finish();
        return this;
    },

    error: function(code, message) {
        code = code || 500;
        var msg = message || this.getErrorHTML(code);
        this.sendHeader(code, {
            "Content-Type": "text/html; charset=UTF-8",
            "Content-Length": msg.length
        });
        this.response.write(msg, "utf8");
        this.finish();
    },

    getErrorHTML: function(code) {
        return "Response status " + code + ": please override getErrorHTML to implement custom error pages.";
    },

    redirect: function(url, permanent) {
        this._cookies = [];
        this.sendHeader(permanent ? 301 : 302, {
            "Location": url
        }).finish();
    },

    /**
     * Handle uploading of one file
     * @see http://github.com/vgrichina/file-upload.git for full example
     *
     */
    uploadFile: function(field, dir, callback, filename, maxSize) {
        maxSize = maxSize || 1048576; // default 1M
        var self = this, fileStream;
        if (this.headers['content-length'] > maxSize) {
            this.request.connection.destroy(); // @todo better solution
            return;
        }
        if (!this.isMultipart) {
            callback('Not a multipart request');
            return;
        }
        this._uploadStream = multipart.parser();
        this._uploadStream.headers = this.headers;
        this.request.setEncoding('binary');
        this.request.addListener("data",
            function(chunk) {
                self._uploadStream.write(chunk);
            });
        this.request.addListener("end",
            function() {
                self._uploadStream.close();
            });
        this._uploadStream.onPartBegin = function(part) {
            // only parse the part that we want to save
            if (part.name === field) {
                // using filename defined in the http header
                if (!filename) {
                    // fix for filename which contains multibytes characters
                    filename = new Buffer(part.filename, 'ascii');
                    filename = filename.toString('utf8');
                }
                fileStream = fs.createWriteStream(path.join(dir, filename));
                fileStream.addListener('error', function(err) {
                    fileStream.end();
                    self._uploadStream.close();
                    callback(err);
                });

                fileStream.addListener('drain', function() {
                    self.request.resume();
                });
            }
        }
        this._uploadStream.onData = function(chunk) {
            self.request.pause();
            fileStream && fileStream.write(chunk, 'binary');
        }
        this._uploadStream.onPartEnd = function(part) {
            if (part.name === field) {
                // close the stream, since we only upload one file
                self._uploadStream.close();
                fileStream && fileStream.addListener("drain", function() {
                    // Close file stream
                    fileStream.end();
                });
                callback(null, filename);
            }
        }
    },

    finish: function() {
        this.response.end();
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
        body = body || ""; // fallback, JSON.stringify will return undefined if body is not valid format
        this.setHeader("Content-Length", body.length);
        this.sendHeader(code || this._statusCode);
        body && this.response.write(body, "utf8"); // write only if we have something
        this.finish();
    },

    staticFile: function(path, type) {
        // this should not be used in production env.
        // @todo mime and encoding
        var self = this;
        fs.readFile(path, 'utf8', function(err, content) {
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
exports.MixedHandler = Handler(Simple)(Stream);