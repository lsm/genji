var name = 'Dummy';

module.exports = {
    name: name,
    makeFlake: function(settings, conf) {
        return function(req, res, go) {
            go();
        }
    }
}