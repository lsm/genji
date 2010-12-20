// require the genji lib
var genji = require('../../lib/genji');

var rpcEndpoint1 = '^/jsonrpc/$';

providers = [
    {
        namespace: 'account',
        methods: {
            login: function(username, password) {}, // rpc.call('account.login', params: ['john', 'pass']);
            signup: function(email, username, password) {}
        }
    },
    {
        namespace: 'blog.post',
        methods: {
            create: function(title, content) {},// rpc.call('blog.post.create', params: ['Hello', 'Hello world!']);
            remove: function(id) {}
        },
        before: function() {
            // validate user
        },
        after: function() {
            // log or trigger events
        }
    }
]

var settings = {
    host: '127.0.0.1',
    port: '8000',
    middlewares: {
        'error-handler': {uncaughtException: true},
        'logger': {level: 'debug'},
        'dev-verbose': {requestHeader: true},
        'jsonrpc': {endpoint: rpcEndpoint1, providers: providers /* before after? */},
        // a middleware can be used as many times as you wish, just set the `name` property to indicate which one to use
        'print-response': {name: 'dev-verbose', responseHeader: true, responseBody: true}
    }
};

genji.web.startServer(settings);