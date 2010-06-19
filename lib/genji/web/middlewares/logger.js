var name = 'Logger';

module.exports = {
    name: name,
    makeFlake: function(settings, conf) {
        return function(req, res, go) {
            this.on('#log', function() {
                
            });
            go();
        }
    }
}