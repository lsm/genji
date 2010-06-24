
/**
 * Module dependencies
 */
var fs = require("fs"),
mime = require("../mime"),
extname = require("path").extname;

module.exports = {
    init: function(request, response, flaker) {
        this._super(request, response, flaker);
        this._onData(false);
    },

    /**
     *  Send response to client in one operation
     *
     *  @param {String|Object} body Body of the http response
     *  @param {Number} [code] Http response status code, default `200`
     *  @param {Object} [headers] Http response headers, default `Content-Type, text/plain; charset=UTF-8`
     *  @param {String} [encoding] default 'utf8'
     */
    send: function(body, code, headers, encoding) {
        headers && typeof headers === "object" && Object.keys(headers).forEach(function(name) {
            this.setHeader(name, headers[name]);
        }, this);
        // fallback, JSON.stringify will return undefined if body is not valid format
        body = (typeof body === "string" ? body : JSON.stringify(body)) || "";
        this.addHeader("Content-Length", body.length);
        this.addHeader("Content-Type", 'text/plain; charset=UTF-8');
        this.sendHeaders(code);
        this.finish(body, encoding);
    },

    /**
     * Read the whole file and write to the client at once
     * @param {String} path Path of the file
     * @param {String} type Mime type, content-type of http headers
     * @param {Function} [errback] Error handling function, default response 500 to the client
     */
    staticFile: function(path, type, errback) {
        // this should not be used in production env.
        var self = this;
        fs.readFile(path, 'binary', function(err, content) {
            if (err) {
                if (typeof errback === 'function')
                    errback(err);
                else
                    self.error(500, 'File error');
                return;
            }
            self.send(content, 200, {
                "Content-Type": type || mime.lookup(extname(path))
            }, 'binary');
        });
    },

    sendJSON: function(data) {
        this.setHeader('Content-Type', 'application/json; charset=UTF-8');
        this.send(data);
    },

    sendHTML: function(data) {
        this.setHeader('Content-Type', 'text/html; charset=UTF-8');
        this.send(data);
    }
}