
// the genji lib
var genji = require('genji');

// use a middleware (at `genji/lib/middleware/helloworld.js`)
genji.use('helloworld');

// create a http server
var server = genji.createServer();

// start handling request
server.listen(8888, '127.0.0.1');

// now open up http://127.0.0.1:8888/ in your browser