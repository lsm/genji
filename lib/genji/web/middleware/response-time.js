module.exports = {
    name: 'ResponseTime',
    make: function() {
        this.add('writeHead', function(statusCode, headers, next) {
            headers['X-Response-Time'] = new Date - this.share.start + 'ms';
            this.next(statusCode, headers);
        });
        return function(req, res, go) {
            this.share.start = new Date;
            go();
        }
    }
}
