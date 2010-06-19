// @todo after route, remove unwanted flakes

var sys = require('sys'),
http = require('http'),
EventEmitter = require('events').EventEmitter;

var Flaker = function(request, response, globalEmitter) {
    // call parent constructor
    EventEmitter.call(this);
    this.request = request;
    this.response = response;
    this._headers = {};
    this._once = {};
    this._statusCode = 200;
    this.ge = this.globalEmitter = globalEmitter;
}

sys.inherits(Flaker, EventEmitter);

var emit = Flaker.prototype.emit;
Flaker.prototype.emit = function(event) {
    if (this.isOnce(event)) {
        this.removeAllListeners(event);
        delete this._once[event];
        return;
    }
    emit.apply(this, arguments);
}

// alias
Flaker.prototype.on = Flaker.prototype.addListener;

Flaker.prototype.isOnce = function(event) {
    if (this._once.hasOwnProperty(event) === false ) {
        return false;
    } else {
        if (this._once[event] > 0) {
            this._once[event] = 0;
            return false;
        } else {
            return true;
        }
    }
}

Flaker.prototype.once = function(event, callback) {
    this._once[event] = true;
    this.addListener(event, callback);
}

// http utilities
Flaker.prototype.addHeader = function(key, value) {
    if (this.getHeader(key)) return;
    this.setHeader(key, value);
}

Flaker.prototype.setHeader = function(key, value) {
    this._headers[key.toLowerCase()] = value; // old value will be overwritten
    return this;
}

Flaker.prototype.getHeader = function(key) {
    return this._headers[key.toLowerCase()];
}

Flaker.prototype.writeHead = function(statusCode, headers) {
    this.response.writeHead(statusCode || this._statusCode, headers || this._headers);
}

Flaker.prototype.setStatus = function(code) {
    if (http.STATUS_CODES.hasOwnProperty(code)) {
        this._statusCode = code;
        return this;
    }
    throw new Error('Unknown HTTP status code ' + code);
}

Flaker.prototype.error = function(code, message) {
    code = code || 500;
    var msg = message || this.getErrorHTML(code);
    this.response.writeHead(code, {
        "Content-Type": "text/html; charset=UTF-8",
        "Content-Length": msg.length
    });
    this.response.end(msg);
}

Flaker.prototype.getErrorHTML = function(code) {
        return "Response status " + code + ": please override getErrorHTML to implement custom error pages.";
}

exports.makeFlaker = function(settings, flakes) {
    var stack = {};
    var names = [];
    var crossRequestEmitter = new EventEmitter;

    flakes.forEach(function(m, i) {
        if (stack.hasOwnProperty(m.name)) {
            throw new Error('Duplicated middleware name');
        }
        var flake = require('./middlewares/' + m.name);
        names[i] = m.name;
        stack[m.name] = flake.makeFlake(settings, m.conf);
    });
    
    return function(request, response) {
        var idx = 0;
        var flaker = new Flaker(request, response, crossRequestEmitter);
        function go(where, jumping) {
            var curr;
            if (where === undefined) {
                // default, go next
                curr = stack[names[idx++]];
                if (!curr) {
                    // end of the stack, it's fine to return here as the middleware is controlled by events.
                    return;
                }
            } else {
                var whereIdx = names.indexOf(where);
                if (whereIdx > -1) {
                    curr = stack[where];
                    if (jumping) {
                        idx = whereIdx + 1;
                    }
                } else {
                    throw new Error('Undefined middleware: ' + where);
                }
            }

            try {
                curr.call(flaker, request, response, go);
            } catch(e) {
                flaker.emit('#error', e);
            }
        }
        // start processing the middlewares
        go();
    }
}