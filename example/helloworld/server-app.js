// require the genji lib
var genji = require('../../lib/genji');

// map url to business logic
var urls = [
    // each member in the `urls` array is a mapping
    // the simplest format would be [RegExp, Function]
    [
        '^/hello/$', // RegExp pattern or object that you want to match
        function(h) { // function which handle your business
            h.sendHTML('Hello world\n');
        }
    ],
    ['^/prefix/', 
        [// you can put an array here instead of function, which means it's a sub-url mapping
            [
                '^a/$', // the url use to match the pattern will become `a/` if the requested url is `/prefix/a/`,
                // so make sure to place the leading `^` in front of `a`, otherwise `/prefix/ba/` will be matched;
                function(h) {h.sendHTML('got a');}
            ],
            // you can define as many sub-url mappings as you wish
            ['^b/$', function(h) {h.sendHTML('got b');}]
    ]],
    ['^/$', function(h) {
            h.sendHTML('<a href="/hello/">Hello world</a>');
    }]
];

var settings = {
    host: '127.0.0.1',
    port: '8000',
    middlewares: {
        'error-handler': {uncaughtException: true},
        'logger': {level: 'debug'},
        'dev-verbose': {requestHeader: true},
        'router': {urls: urls},
        // a middleware can be used as many times as you wish, just set the `name` property to indicate which one to use
        'print-response': {name: 'dev-verbose', responseHeader: true, responseBody: true}
    }
};

genji.web.startServer(settings);