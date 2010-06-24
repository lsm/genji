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
            this.addFilter('writeHead', function(statusCode, headers) {
                if (statusCode == 304) {
                    this(statusCode, headers);
                }
                var etag = headers['etag'],
                lastModified = headers['last-modified'];
                if (etag && etag == noneMatch) {
                        statusCode = 304;
                }
                if (lastModified && lastModified == modifiedSince) {
                        statusCode = 304;
                }
                if (statusCode == 304) {
                    delete headers['content-length'];
                    me.addFilter('write', function(data) {
                        data = null;
                    });
                }
                this(statusCode, headers);
            });
            go();
        }
    }
}