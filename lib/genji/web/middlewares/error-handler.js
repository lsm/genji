
var name = 'ErrorHandler';

module.exports = {
    name: name,
    makeFlake: function(settings, conf) {
        return function(req, res, go) {
            var me = this;
            this.on('error', function(err, code, msg) {
                if (err) {
                    // we got exception
                    me.ge.emit('log', 'fatal', err.stack || err.message || err);
                } else if (code) {
                    // user defined error
                    me.ge.emit('log', 'error', code, msg);
                }
            })
            go();
        }
    }
}