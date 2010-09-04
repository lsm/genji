module.exports = {
    name: 'ErrorHandler',
    make: function(settings, conf) {
        this.addListener('error', function(err) {
            if (err.exception) {
                // we got exception
                this.emit('log', 'fatal', err.exception.stack || err.exception.message);
            } else if (err.code) {
                // user defined error
                this.emit('log', 'error', err.code, err.message);
            }
        })
        // this middleware is available as an event of the flaker.
        // no need to alter things on each request, return false;
        return false;
    }
}