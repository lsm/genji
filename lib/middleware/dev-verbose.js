// display useful info of request in console

var util = require('util'),
    counter = 0;

module.exports = {
  name: 'DevVerbose',
  make: function(conf) {
    conf.requestUrl = conf.requestUrl ? conf.requestUrl : true;
    if (conf.responseHeader || conf.responseBody) {
      this.add('writeHead', function(status, header) {
        console.log('\n<--Response [%d]: status %s', this.context._requestCounter, status);
        if (conf.responseHeader) {
          console.log(header);
        }
        return true;
      });
      this.add('write', function(chunk, encoding) {
        conf.responseBody && console.log(chunk);
        return true;
      });
      this.add('end', function(chunk, encoding) {
        conf.responseBody && console.log(chunk);
        return true;
      });
    }

    return function(req, res, go) {
      counter++;
      if (conf.responseHeader || conf.responseBody) return go();
      this._requestCounter = counter;
      console.log('\n-->Request [%d]: `%s` (%s) `%s`', counter, req.socket.remoteAddress, req.method, req.url);
      if (conf.requestHeader) {
        console.log(req.headers);
      }
      if (conf.requestBody) {
        req.on('data', function(chunk) {
          console.log('Body chunk: %s \n', chunk);
        });
      }
      go();
    };
  }
};