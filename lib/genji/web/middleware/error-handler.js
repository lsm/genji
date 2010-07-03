module.exports = {
    name: 'ErrorHandler',
    makeFlake: function(settings, conf) {
        var me = this;
        this.addListener('error', function(err, code, msg) {
            if (err) {
                // we got exception
                me.emit('log', 'fatal', err.stack || err.message || err);
            } else if (code) {
                // user defined error
                me.emit('log', 'error', code, msg);
            }
        })
        return false;
    }
}