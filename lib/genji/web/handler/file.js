// Static file handler


/**
 * Module dependencies
 */
var fs = require("fs"),
Path = require('path'),
mime = require("../mime"),
extname = require("path").extname,
md5 = require('../../util/crypto').md5;

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
        var self = this,
        contentType = mime.lookup(extname(filePath));
        fs.stat(filePath, function(err, stat) {
            if (err || !stat.isFile()) {
                errback ? errback(err) : self.error(404, 'File not found');
                return;
            }

            self.context.writeHead(200, {
                'content-type': contentType,
                'content-length': stat.size,
                'etag': '"' + md5(stat.size + '-' + stat.ino + '-' + Date.parse(stat.mtime)) +'"'
                });
            if (self.context._statusCode == 200) {
                // read file only no one alter the status code
                var s = fs.createReadStream(filePath, streamOptions);
                s.addListener('data', function(data) {
                    self.context.write(data, 'binary');
                }).addListener('end', function() {
                    self.finish();
                }).addListener('error', function(e) {
                    errback ? errback(e) : self.error(404, 'File not found');
                    self.context.emit('error', {
                        exception: e,
                        code: 400,
                        message: 'Failed to read file ' + filePath + ' from filesystem'
                    });
                });
            }
        });
    }
}