
var name = exports.name = 'ResponseTime';

exports.makeFlake = function makeFlake(conf) {

    return function(req, res, go) {
        // local setting, construct each time
        var start = new Date;
        var me = this;
        this.addListener(name, function() {
            me.addHeader('X-Response-Time', new Date - start + 'ms');
        });
        go();
    }
}
