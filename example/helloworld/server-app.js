var genji = require('../../lib/genji');

var urls = [
    ['/hello', function(h) {
            h.sendHTML('Hello world\n');
    }]
]

genji.web.router.createServer(urls, genji.web.handler.SimpleHandler)