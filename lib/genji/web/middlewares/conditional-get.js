// ported from django
var name = 'ConditionalGet';

module.exports = {
    name: name,
    makeFlake: function(settings, conf) {
        return function(req, res, go) {
            var noneMatch = req.headers['if-none-match'],
            modifiedSince = req.headers['if-modified-since'];
            if (!(req.method === "GET" && (modifiedSince || noneMatch))) {
                go();
                return;
            }
            var me = this;
            this.on('#writeHead', function() {
                this.addHeader('Date', (new Date).toGMTString());
                if (me.getHeader('ETag') == noneMatch) {
                        me.setStatus(304);
                }
                if (me.getHeader('Last-Modified') == modifiedSince) {
                        me.setStatus(304);
                }
            });
            go();
        }
    }
}