var genji = require('../../lib/genji');

var urls = [
    ['^/hello/$', function() {
            this.sendHTML('Hello world\n');
    }],
    ['^/prefix/', [
            ['a/$', function() {this.sendHTML('got a');}],
            ['b/$', function() {this.sendHTML('got b');}]
    ]]
]

genji.web.startServer({
    host: '127.0.0.1',
    port: '8000',
    middlewares: [
        {name: 'error-handler'},
        {name: 'logger'},
        {name: 'router', urls: urls}
    ]
})