var genji = require('../../lib/genji');

genji.web.startServer({
    host: '127.0.0.1',
    port: '8000',
    middlewares: {'helloworld': {}}
})