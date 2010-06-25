// inspired by Connect

var sys = require('sys'),
http = require('http'),
Base = require('../core').Base,
slice = Array.prototype.slice,
EventEmitter = require('events').EventEmitter;

var Flaker = Base(EventEmitter, {
    init: function(request, response, globalEmitter) {
        this._super();
        this.request = request;
        this.response = response;
        this._filter = {};
        this.ge = this.globalEmitter = globalEmitter;
    },

    //alias
    on: EventEmitter.prototype.addListener,

    addFilter: function(type, func) {
        var prev = this.getFilter(type), filter;
        if (typeof prev === 'function') {
            filter = function() {
                prev.apply(func, slice.call(arguments, 0));
            }
        } else {
            filter = func;
        }
        this._filter[type] = filter;
    },

    getFilter: function(type) {
        return this._filter[type];
    },

    // http utilities
    writeHead : function(statusCode, headers) {
        var me = this;
        this.addFilter('writeHead', function(statusCode, headers) {
            // the final filter which writes to the response
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
    var crossRequestEmitter = new EventEmitter;

    var idx = 0;
    flakes.forEach(function(m) {
        if (stack.hasOwnProperty(m.name)) {
            throw new Error('Duplicated middleware name');
        }
        var flake = require('./middlewares/' + m.name);
        var f  = flake.makeFlake.call(crossRequestEmitter, settings, m.conf);
        if (f) {
            names[idx++] = m.name;
            stack[m.name] = f;
        }
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
                crossRequestEmitter.emit('error', e);
            }
        }
        // start processing the middlewares
        go();
    }
}