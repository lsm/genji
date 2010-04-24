// JSON-RPC, inspired http://github.com/ericflo/node-jsonrpc/
var Base = require("../core/base").Base;

exports.expose = function(methods) {
    return function(handler) {
        // handler.include(exports); // extends handler with rpc
        if (rpc.call(handler, methods)) { // basic rpc validation
            handler.on("data_received",
            function(data) {
                handler.fire("rpc", data);
            });
        }
    }
}

/**
 *
 * SimpleJSON, StreamJSON, EventJSON?
 */

var SimpleJSON = Base({
    success: function() {
        
    },
    
    error: function() {
        
    }
});

// low level code should throw exceptions, high level code catch the exception and think what todo
var rpc = function(methods) {
    if (this.headers["Content-Type"] == "application/json") {
        // if we suppose to get json, register a event
        this.on("rpc",
        function(data) {
            try {
                var parsed = JSON.parse(data);
                if (methods && parsed.method && methods.hasOwnProperty(parsed.method)) {
                    try {
                        var result = methods[parsed.method].apply(handler, parsed.params);
                        // you should throw exception here, if you want to return error message
                        if (result instanceof process.Promise) {
                            result.addCallback(rpcSuccess).addErrback(rpcError);
                        } else {
                            rpcSuccess.call(this, result, parsed.id);
                        }
                    } catch(e) { // bussines level error
                        rpcError.call(this, -4, e, parsed.id);
                    }
                } else {
                    rpcError.call(this, -2, "method not exists", parsed.id);
                }
            } catch(e) {
                rpcError.call(this, -3, "not vaild json format");
            }
        });
        return true;
    }
    rpcError.call(this, -3, "only json is allowed"); // throw error or fire event instead of return
    return false;
}

var rpcError = function(code, message, id) {
    var error = JSON.stringify({
        "error": {
            "code": code || -1,
            "message": message || "unknown error"
        },
        "id": id || null
    });
    this.send(200, ["Content-Type", "application/json"], error);
}

var rpcSuccess = function(result, id) {
    var encoded = JSON.stringify({
        'result': result,
        'id': id || null
    });
    this.send(200, ["Content-Type", "application/json"], encoded);
}