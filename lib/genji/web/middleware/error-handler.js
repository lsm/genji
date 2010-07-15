module.exports = {
    name: 'ErrorHandler',
    makeFlake: function(settings, conf) {
        var me = this;
        this.addListener('error', function(err) {
            if (err.exception) {
                // we got exception
                me.emit('log', 'fatal', err.exception.stack || err.exception.message);
            } else if (err.code) {
                // user defined error
                me.emit('log', 'error', err.code, err.message);
            }
        })
        return false;
    }
}