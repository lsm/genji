// minimal example of middleware
module.exports = {
    name: 'Dummy',
    make: function(settings, conf) {
        return function(req, res, go) {
            go();
        }
    }
}