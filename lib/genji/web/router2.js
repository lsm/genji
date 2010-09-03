

/**
 * Check the input url pattern and format it to regexp if need
 *
 * @private
 * @param {String|RegExp} pattern Url pattern in format of string or regular expression
 * @returns {RegExp}
 * @throws {Error}
 */
function _formatPattern(pattern) {
    if (pattern instanceof RegExp) return pattern;
    if (typeof pattern === "string") return new RegExp(pattern);
    throw new Error("Invaild url pattern");
}

function build(urls) {
    var ret = {};
    for (var i in urls) {
        var url = urls[i];
        var hasSub = url.urls && url.urls.length > 0, type = url.type.toUpperCase(),
        handler = url.handler, handleFunction = url.handleFunction;
        var pattern = _formatPattern(url.pattern);
        if (!ret.hasOwnProperty(type)) {
            ret[type] = [];
        }
        var current = {};

        if (hasSub) {
            // sub-urls
            current.match = function(url) {
                return url.replace(pattern, '');
            }
            current.rules = build(url.urls);
        } else {
            current.dispatch = function(obj) {
                var args = obj.matched.slice(1);
                args.unshift(handler);
                handleFunction.apply(obj, args);
            }
            current.match = function(url) {
                return pattern.exec(url);
            }
        }
        ret[type].push(current);
    }
    return ret;
}



function route(input, rules, notFound) {
    var _rules = rules[input.type];
    for (var i in _rules) {
        var rule = _rules[i];
        var condition = input.matched ? input.matched : input.condition;
        var matched = rule.match(condition);
        if (matched != condition) {
            input.matched = matched;
            if (rule.rules) {
                // route to submodule
                route(input, rule.rules, notFound);
            } else {
                rule.dispatch(input);
            }
            return;
        }
    }
    notFound();
}


// example

/*
var http = require('http');

var urls = [{
    type: 'get',
    pattern: '^/hello/',
    handler: '', // default SimpleHandler
    handleFunction: function() {
        console.log(arguments)
    },
    urls: [{
        type: 'get',
        pattern: 'a/',
        handler: '', // default SimpleHandler
        handleFunction: function() {
            console.log(arguments)
        },
        urls: [{
            type: 'get',
            pattern: 'b/(.*)/$',
            handler: '', // default SimpleHandler
            handleFunction: function() {
                this.response.writeHead(200, {'Content-Type': 'text/plain'});
                this.response.end('Here you are\n');
            }
        }]
    }]
}]

var sys = require('sys'),
puts = sys.puts,
isp = sys.inspect,
ps= function(obj) {
    console.log(sys.inspect(obj, true, 6))
    };

var rules = build(urls);


var fn = function (request, response) {
    var input = {
        request: request,
        response: response,
        type: request.method,
        condition: request.url
    }

    route(input, rules, function() {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('Not found\n');
    })

}

http.createServer(fn).listen(8000);

console.log('Server running at http://127.0.0.1:8000/');
*/