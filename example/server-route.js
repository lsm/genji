/**
 * Example for using Router of Genji
 */

/**
 * Module dependencies
 */
var http = require('http');
var genji = require('../lib/genji');

// create a router instance
var router = genji.route();

// routing url to function
router.get('^/$', function(context) {
  context.send('Hello world!');
});

// create a http server
var server = http.createServer();

// listen to the request event of server
router.listen(server);

// start handling request
server.listen(8888, '127.0.0.1');

// open http://127.0.0.1:8888/