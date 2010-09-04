exports.auth = require('./auth');
exports.router = require("./router");
exports.handler = require("./handler");
var http = require("http"),
Flaker = exports.middleware = require('./middleware');

var createServer = exports.createServer = function(settings) {
    var middleware = new Flaker.makeFlaker(settings, settings.middlewares);
    return http.createServer(middleware);
}

exports.startServer = function(settings, callback) {
    var server = createServer(settings);
    server.listen(settings.port, settings.host, callback);
    return server;
}