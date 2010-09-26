// minimal example of middleware
module.exports = {
    name: 'Dummy',
    make: function() {
        return function(req, res, go) {
            go();
        }
    }
}