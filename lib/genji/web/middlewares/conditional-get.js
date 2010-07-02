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
                    // 304 already setted by upstream filter/handler, go next to avoid conflict
                    this(statusCode, headers);
                    return;
                }
                var etag = headers['etag'],
                lastModified = headers['last-modified'];
                if (etag && etag == noneMatch) {
                        statusCode = 304;
                } else if (lastModified && lastModified == modifiedSince) {
                        statusCode = 304;
                }
                if (statusCode == 304) {
                    // 304 is setted by current filter, write to the client directly, filter stops.
                    delete headers['content-length'];
                    me.addFilter('write', function(data) {
                        // avoid writing data to client
                        me.response.end();
                    });
                    me.response.writeHead(statusCode, headers);
                    return;
                }
                this(statusCode, headers);
            });
            go();
        }
    }
}