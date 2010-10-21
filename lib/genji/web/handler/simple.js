var Buffer = require('buffer').Buffer;

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
        this.addHeader("Content-Length", Buffer.byteLength(body, encoding || this._encoding));
        this.addHeader("Content-Type", 'text/plain; charset=utf-8');
        this.sendHeaders(code);
        this.finish(body, encoding);
    },

    sendJSON: function(data) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
        this.send(data);
    },

    sendHTML: function(data) {
        this.setHeader('Content-Type', 'text/html; charset=utf-8');
        this.send(data);
    }
}