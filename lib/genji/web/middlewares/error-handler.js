var name = 'ErrorHandler';

module.exports = {
    name: name,
    makeFlake: function(conf) {
        return function(req, res, go) {
            this.on('#error', function(e) {
                dump(e);
            })
            go();
        }
    }
}