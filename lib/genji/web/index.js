exports.auth = require('./auth');
exports.router = require("./router");
exports.handler = require("./handler");
exports.run = exports.router.createServer;
var http = require("http"),
flaker = exports.middleware = require('./middleware');

var createServer = exports.createServer = function(settings) {
    var middleware = new flaker.makeFlaker(settings);
    var server = http.createServer(middleware);
    return server; 
}

exports.startServer = function(settings) {
    createServer(settings).listen(8000, '127.0.0.1');
}
