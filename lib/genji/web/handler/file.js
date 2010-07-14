// Static file handler


/**
 * Module dependencies
 */
var fs = require("fs"),
Path = require('path'),
mime = require("../mime"),
extname = require("path").extname,
md5 = require('../../crypto').md5;

var streamOptions = {
    'encoding': 'binary'
} //default: {'flags': 'r', 'mode': 0666, 'bufferSize': 4 * 1024};

module.exports = {
    setRoot: function(path) {
        this.root = path;
    },

    /**
     * Read the file stream to the client
     * @param {String} filePath Path of the file
     * @param {Function} [errback] Error handling function, default response 404 to the client
     */
    staticFile: function(filePath, errback) {
        filePath = Path.join(this.root, decodeURIComponent(filePath));
        var me = this,
        contentType = mime.lookup(extname(filePath));
        fs.stat(filePath, function(err, stat) {
            if (err || !stat.isFile()) {
                errback ? errback(err) : me.error(404, 'File not found');
                return;
            }
            // writeHead not working (this?)
            me.flaker.writeHead(200, {
                'content-type': contentType,
                'content-length': stat.size,
                'etag': '"' + md5(stat.size + '-' + stat.ino + '-' + Date.parse(stat.mtime)) +'"'
                });
            if (me.flaker._statusCode == 200) {
                // read file only no one alter the status code
                var s = fs.createReadStream(filePath, streamOptions);
                s.addListener('data', function(data) {
                    me.flaker.write(data, 'binary');
                }).addListener('end', function() {
                    me.finish();
                }).addListener('error', function(e) {
                    errback ? errback(e) : me.error(404, 'File not found');
                });
            } else {
                me.finish();
            }
        });
    }
}