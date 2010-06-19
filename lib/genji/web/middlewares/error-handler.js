
var name = 'ErrorHandler';

module.exports = {
    name: name,
    makeFlake: function(conf) {
        return function(req, res, go) {
            this.on('#error', function(err, code, msg) {
                if (err) {
                    // we got exception
                    dump(err.stack);
                } else if (code) {
                    // user defined error
                    this.error(code, msg);
                }
            })
            go();
        }
    }
}