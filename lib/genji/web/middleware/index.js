// inspired by Connect

var Base = require('../../pattern/base'),
Chain = require('../../pattern/control').Chain,
Const = require('../../const'),
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
            this.context._statusCode = statusCode;
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


exports.makeFlaker = function(flakes) {
    var stack = {};
    var names = [];
    var flaker = new Flaker;

    if (Array.isArray(flakes)) {
        // old config
        console.log('WARNNING: You are using old middleware configuration format. \n\
            Please refer the project homepage and use the new style.');
        flakes.forEach(function(m) {
            var path = m.path ? m.path : __dirname;
            var flake = require(Path.join(path, m.name));
            if (stack.hasOwnProperty(flake.name)) {
                throw new Error('Duplicated middleware name: ' + flake.name);
            }
            var f = flake.make.call(flaker, m);
            if (f) {
                names.push(flake.name);
                stack[flake.name] = f;
            }
        });
    } else {
        for (var name in flakes) {
            var m = flakes[name], flake;
            if (m.module) {
                // module provided directly no more require need
                flake = m.module;
            } else {
                var path = m.path ? m.path : __dirname;
                flake = require(Path.join(path, name));
            }
            if (stack.hasOwnProperty(flake.name)) {
                throw new Error('Duplicated middleware name: ' + flake.name);
            }
            var f = flake.make.call(flaker, m);
            if (f) {
                names.push(flake.name);
                stack[flake.name] = f;
            }
        }
    }

    // default error listener, if there's no listener for `error` event
    if (flaker.listeners('error').length == 0) {
        flaker.on('error', function(obj) {
            console.log(obj);
        });
    }

    // get the chain of functions
    var writeHead = flaker.writeHead();
    var write = flaker.write();
    var end = flaker.end();

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
            var err = {
                exception: e,
                code: Const.ERROR_MIDDLEWARE,
                message: 'Your middleware `'+ names[idx-1] +'` threw exception.',
                request: request,
                response: response
            };
            err.stack = e.stack || e.message;
            flaker.emit('error', err);
        }
    }
 
    return function(request, response) {
        // each request should have their own context
        var ctx = {
            // original http.serverRequest and http.serverResponse object emitted from `request` event of http.Server
            request: request,
            response: response,
            // the `writeHead`, `write`, `end` chain,
            // corresponding functions of response object will be called in the last step
            writeHead: function(statusCode, headers) {
                headers = headers || {};
                writeHead.call({context: ctx, request: request, response: response}, statusCode, headers);
            },
            write: function(chunk, encoding) {
                write.call({context: ctx, request: request, response: response}, chunk, encoding);
            },
            end: function(chunk, encoding) {
                end.call({context: ctx, request: request, response: response}, chunk, encoding);
            },
            emit: function() {
                flaker.emit.apply(flaker, arguments);
            }
        };
        // start processing the middlewares
        try {
            go(0, ctx, request, response);
        } catch (e) {
            flaker.emit('error', {
                exception: e,
                code: Const.ERROR_MIDDLEWARE,
                message: 'Error when processing middlewares.',
                request: request,
                response: response
            });
        }   
    }
}