
/**
 * Module dependencies
 */
var path = require('path'),
Buffer = require('buffer').Buffer,
multipart = require('../../../support/multipart-js/lib/multipart');

/**
 * Handle uploading of one file
 * @see http://github.com/vgrichina/file-upload.git for full example
 *
 */
module.exports = {
    uploadFile: function(field, dir, callback, filename, maxSize) {
        maxSize = maxSize || 1048576; // default 1M
        var self = this, fileStream;
        if (this.headers['content-length'] > maxSize) {
            this.request.connection.destroy(); // @todo better solution
            return;
        }
        if (!this.isMultipart) {
            callback('Not a multipart request');
            return;
        }
        this._uploadStream = multipart.parser();
        this._uploadStream.headers = this.headers;
        this.request.setEncoding('binary');
        this.request.addListener("data",
            function(chunk) {
                self._uploadStream.write(chunk);
            });
        this.request.addListener("end",
            function() {
                self._uploadStream.close();
            });
        this._uploadStream.onPartBegin = function(part) {
            // only parse the part that we want to save
            if (part.name === field) {
                // using filename defined in the http header
                if (!filename) {
                    // fix for filename which contains multibytes characters
                    filename = new Buffer(part.filename, 'ascii');
                    filename = filename.toString('utf8');
                }
                fileStream = fs.createWriteStream(path.join(dir, filename));
                fileStream.addListener('error', function(err) {
                    fileStream.end();
                    self._uploadStream.close();
                    callback(err);
                });

                fileStream.addListener('drain', function() {
                    self.request.resume();
                });
            }
        }
        this._uploadStream.onData = function(chunk) {
            self.request.pause();
            fileStream && fileStream.write(chunk, 'binary');
        }
        this._uploadStream.onPartEnd = function(part) {
            if (part.name === field) {
                // close the stream, since we only upload one file
                self._uploadStream.close();
                fileStream && fileStream.addListener("drain", function() {
                    // Close file stream
                    fileStream.end();
                });
                callback(null, filename);
            }
        }
    }
}