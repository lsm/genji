
// the genji lib
var genji = require('genji');

// create a app instance
var helloApp = genji.app();

// routing url to function
helloApp.get('^/$', function(handler) {
  handler.send('Hello world!');
});

// create a http server
var server = genji.createServer();

// start handling request
server.listen(8888, '127.0.0.1');

// now open up http://127.0.0.1:8888/ in your browser