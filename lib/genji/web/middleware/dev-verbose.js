// display useful info of request in console

var util = require('util'),
counter = 1;

module.exports = {
    name: 'DevVerbose',
    make: function(conf) {
        conf.requestUrl = conf.requestUrl ? conf.requestUrl : true;
        if (conf.responseHeader || conf.responseBody) {
            this.add('writeHead', function(status, header) {
                console.log('\n<--Response [%d]: status %s', counter, status);
                if (conf.responseHeader){
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
            if (conf.responseHeader || conf.responseBody) return go();
            console.log('\n-->Request [%d]: `%s` (%s) `%s`', counter, req.socket.remoteAddress, req.method, req.url);
            if (conf.header) {
                console.log(req.headers);
            }
            go();
            counter++;
        }
    }
}