// inspired by Connect

var sys = require('sys'),
http = require('http'),
Base = require('../../pattern/base'),
Filter = require('../../pattern/filter'),
slice = Array.prototype.slice,
EventEmitter = require('events').EventEmitter,
globalEmitter = new EventEmitter;
exports.globalEmitter = globalEmitter;

var Flaker = Base(EventEmitter, Filter).include({
    init: function(request, response) {
        this._super();
        this.request = request;
        this.response = response;
        this.ge = this.globalEmitter = globalEmitter;
        this.num = 0;
    },

    // http utilities
    writeHead : function(statusCode, headers) {
        var me = this;
        this.addFilter('writeHead', function(statusCode, headers) {
            // the final filter which writes to the response
            me._statusCode = statusCode;
            me.response.writeHead(statusCode, headers);
        });
        // call the chain
        try {
            this.getFilter('writeHead')(statusCode, headers);
        } catch(e) {
            this.ge.emit('error', e);
        }
    },

    write: function(chunk, encoding) {
        var me = this;
        this.addFilter('write', function(chunk, encoding) {
            me.response.write(chunk, encoding);
        });
        try {
            this.getFilter('write')(chunk, encoding);
        } catch(e) {
            this.ge.emit('error', e);
        }
    }
});

exports.makeFlaker = function(settings, flakes) {
    var stack = {};
    var names = [];

    var idx = 0;
    flakes.forEach(function(m) {
        if (stack.hasOwnProperty(m.name)) {
            throw new Error('Duplicated middleware name');
        }
        var flake = require('./' + m.name);
        var f  = flake.makeFlake.call(globalEmitter, settings, m.conf);
        if (f) {
            names[idx++] = m.name;
            stack[m.name] = f;
        }
    });
    
    return function(request, response) {
        var idx = 0;
        var flaker = new Flaker(request, response);
        function go(where, jumping) {
            var curr;
            if (where === undefined) {
                // default, go next
                curr = stack[names[idx++]];
                if (!curr) {
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
                globalEmitter.emit('error', {
                    exception: e,
                    code: 500,
                    message: 'Internal server error',
                    request: request,
                    response: response
                });
            }
        }
        // start processing the middlewares
        go();
    }
}