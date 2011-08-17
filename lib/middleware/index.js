// inspired by Connect

var Base = require('../base'),
    Chain = require('../control').Chain,
    EventEmitter = require('events').EventEmitter,
    Path = require('path');


var Flaker = Base(EventEmitter, Chain).include({
  // http utilities
  writeHead: function() {
    this.add('writeHead', function(statusCode, headers) {
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


module.exports = function(flakes) {
  var stack = {};
  var names = [];
  var flaker = new Flaker();

  if (flakes) {
    for (var name in flakes) {
      var m = flakes[name], flake, flakeName = m.name || name;
      if (m.module) {
        // module provided directly no more `require` need
        flake = m.module;
      } else {
        var path = m.path ? m.path : __dirname;
        flake = require(Path.join(path, flakeName));
      }
      if (stack.hasOwnProperty(name)) {
        throw new Error('Duplicated middleware name: ' + name);
      }
      var f = flake.make.call(flaker, m);
      if (f) {
        names.push(name);
        stack[name] = f;
      }
    }
  }
  if (flaker.listeners('error').length === 0) {
    // no error event listener, output to stderr
    flaker.on('error', function(err) {
      console.error('Error: %s, %s', err.code, err.message);
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

    curr.call(ctx, request, response, function(where, jumping) {
      go(idx, ctx, request, response, where, jumping);
    });
  }

  return function(request, response) {
    // each request should have their own context
    var ctx = {
      // original http.serverRequest and http.serverResponse object emitted from `request` event of http.Server
      request: request,
      response: response,
      // the `writeHead`, `write`, `end` chain,
      // each of them has their own context, which also has a `context` property that refer the global context unique for each request
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
    go(0, ctx, request, response);
  };
};