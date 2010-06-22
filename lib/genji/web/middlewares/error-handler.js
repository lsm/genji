
var name = 'ErrorHandler';

module.exports = {
    name: name,
    makeFlake: function(settings, conf) {
        return function(req, res, go) {
            var me = this;
            this.on('#error', function(err, code, msg) {
                if (err) {
                    // we got exception
                    me.emit('#log', 'fatal', err.stack);
                    this.error(500);
                } else if (code) {
                    // user defined error
                    me.emit('#log', 'error', code, msg);
                    this.error(code, msg);
                }
            })
            go();
        }
    }
}