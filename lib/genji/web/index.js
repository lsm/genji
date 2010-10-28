exports.auth = require('./auth');
exports.router = require("./router");
exports.handler = require("./handler");
exports.cookie = require('./cookie');

var http = require("http"),
Flaker = exports.middleware = require('./middleware');

var createServer = exports.createServer = function(middlewares) {
    var middleware = new Flaker.makeFlaker(middlewares);
    return http.createServer(middleware);
}

exports.startServer = function(settings, callback) {
    var server = createServer(settings.middlewares);
    server.listen(settings.port, settings.host, callback);
    return server;
}