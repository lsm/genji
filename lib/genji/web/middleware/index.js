// inspired by Connect

var Base = require('../../pattern/base'),
Chain = require('../../pattern/control').Chain,
EventEmitter = require('events').EventEmitter,
Path = require('path');


var Flaker = Base(EventEmitter, Chain).include({
    init: function() {
        this._super();
    },

    // http utilities
    writeHead: function() {
        this.add('writeHead', function(statusCode, headers, next) {
            // the final chain which writes to the response
            this.response.writeHead(statusCode, headers);
        });
        // return the stacked callbacks
        return this.get('writeHead');
    },

    write: function() {
        this.add('write', function(chunk, encoding) {
            this.response.write(chunk, encoding);
        });
        return this.get('write');
    },

    end: function() {
        this.add('end', function(chunk, encoding) {
            this.response.end(chunk, encoding);
        });
        return this.get('end');
    }
});


exports.makeFlaker = function(settings, flakes) {
    var stack = {};
    var names = [];
    var flaker = new Flaker;

    var midx = 0;
    flakes.forEach(function(m) {
        // @todo more flexible name
        if (stack.hasOwnProperty(m.name)) {
            throw new Error('Duplicated middleware name');
        }
        try {
            var path = m.path ? m.path : __dirname;
            var flake = require(Path.join(path, m.name));
            var f = flake.make.call(flaker, settings, m);
            if (f) {
                names[midx++] = m.name;
                stack[m.name] = f;
            }
        } catch(e) {
            flaker.emit('error', {
                exception: e,
                code: 500,
                message: 'Error during middleware setup.'
            });
        }
    });

    // default error listener, if there's no listener for `error` event
    if (flaker.listeners('error').length == 0) {
        flaker.on('error', function(obj) {
            console.log(obj);
        });
    }

    // get the chain of functions
    var writeHead = flaker.writeHead();
    var write= flaker.write();
    var end= flaker.end();

    function go(idx, ctx, request, response, where, jumping) {
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
            curr.call(ctx, request, response, function(where, jumping) {
                go(idx, ctx, request, response, where, jumping)
            });
        } catch(e) {
            flaker.emit('error', {
                exception: e,
                code: 500,
                message: 'Your middleware `'+ names[idx-1] +'` threw exception.',
                request: request,
                response: response
            });
        }
    }
 
    return function(request, response) {
        // each request should have their own context
        var ctx = {
            // you can use this object to share data between middlewares in the same session
            share: {},
            // original http.serverRequest and http.serverResponse object emitted from `request` event of http.Server
            request: request,
            response: response,
            // the `writeHead`, `write`, `end` chain,
            // corresponding functions of response object will be called in the last step
            writeHead: function(statusCode, headers) {
                headers = headers || {};
                writeHead.call({request: request, response: response, step: 0, share: this.share}, statusCode, headers);
            },
            write: function(chunk, encoding) {
                write.call({request: request, response: response, step: 0, share: this.share}, chunk, encoding);
            },
            end: function(chunk, encoding) {
                end.call({request: request, response: response, step: 0, share: this.share}, chunk, encoding);
            },
            emit: function() {
                flaker.emit.apply(flaker, arguments);
            }
        };
        // start processing the middlewares
        go(0, ctx, request, response);
    }
}