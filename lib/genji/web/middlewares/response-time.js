
var name = exports.name = 'ResponseTime';

exports.makeFlake = function makeFlake(conf) {
    return function(req, res, go) {
        var start = new Date;
        this.addFilter('writeHead', function(statusCode, headers) {
            headers['X-Response-Time'] = new Date - start + 'ms';
            this(statusCode, headers);
        });
        go();
    }
}
