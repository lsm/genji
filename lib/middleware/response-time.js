module.exports = {
  name: 'ResponseTime',
  make: function() {
    this.add('writeHead', function(statusCode, headers) {
      headers['X-Response-Time'] = new Date() - this.context.startTime + 'ms';
      this.next(statusCode, headers);
    });
    return function(req, res, go) {
      this.startTime = new Date();
      go();
    };
  }
};