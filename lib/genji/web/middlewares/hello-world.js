exports.name = 'HelloWorld';

exports.makeFlake = function(conf) {
    return function(req, res, go) {
        // local setting, construct each time
        var body = 'Hello World';
        this.addHeader('Content-Type', 'text/plain');
        this.addHeader('Content-Length', body.length);
        this.emit('#writeHead');
        res.end(body);
    }
}