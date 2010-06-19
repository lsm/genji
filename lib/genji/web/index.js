exports.auth = require('./auth');
exports.router = require("./router");
exports.handler = require("./handler");
var http = require("http"),
flaker = exports.middleware = require('./middleware');

var createServer = exports.createServer = function(settings) {
    var middleware = new flaker.makeFlaker(settings, settings.middlewares);
    return http.createServer(middleware);
}

exports.startServer = function(settings) {
    var option = settings.servers[0];
    createServer(settings).listen(option.port, option.host);
}
