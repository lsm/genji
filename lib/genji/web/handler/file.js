// Static file handler


/**
 * Module dependencies
 */
var fs = require("fs"),
Path = require('path'),
mime = require("../mime"),
extname = require("path").extname,
Buffer = require('buffer').Buffer,
md5 = require('../../util/crypto').md5;

var streamOptions = {
    'encoding': 'binary'
} //default: {'flags': 'r', 'mode': 0666, 'bufferSize': 4 * 1024};

module.exports = {
    
    /**
     * Read the file stream to the client
     * 
     * @param {String} filePath Absolute path of the file
     * @param {String} [etag] Set the etag other than generate from inode info
     * @param {Function} [errback] Error handling function, default response 404 to the client
     */
    staticFile: function(filePath, etag, errback) {
        var self = this, ctx = this.context,
        contentType = mime.lookup(extname(filePath));
        if (typeof etag === "function") {
            errback = etag;
            etag = null;
        }
        fs.stat(filePath, function(err, stat) {
            if (err || !stat.isFile()) {
                errback ? errback(err) : self.error(404, 'File not found');
                return;
            }
            ctx.writeHead(200, {
                'content-type': contentType,
                'content-length': stat.size,
                'etag': '"' + (etag || md5(stat.size + '-' + stat.ino + '-' + Date.parse(stat.mtime))) +'"'
            });
            
            if (ctx._statusCode === 200) {
                // read file only no one alter the status code
                fs.createReadStream(filePath, streamOptions)
                .addListener('data', function(data) {
                    ctx.write(data, 'binary');
                })
                .addListener('end', ctx.end)
                .addListener('error', function(e) {
                    errback ? errback(e) : self.error(404, 'File not found');
                    ctx.emit('error', {
                        exception: e,
                        code: 400,
                        message: 'Failed to read file ' + filePath + ' from filesystem'
                    });
                });
            }
        });
    },

    /**
     * Send content as file
     *
     *@param {String|Function} content The content need to send or a function which can feed the content:
     * <code>
     *     function content(callback) {
     *         // do some stuff to get the data
     *         var data = 'hello';
     *         // call the callback with data you want to send
     *         callback(data);
     *     }
     * </code>
     *@param {Object} [meta] Meta info of file
     *  {
     *      type: 'image/jpeg', // http content type
     *      length: 300, // http content length
     *      ext: '.jpg', // file extension
     *  }
     */
    sendAsFile: function(content, meta) {
        meta = meta || {};
        var encoding = meta.encoding || 'binary',
        contentIsFunc = typeof content === 'function',
        header = {
            'content-type': meta.type || mime.lookup(meta.ext || ''),
            'content-length': meta.length || Buffer.byteLength(content, encoding),
            'etag': '"' + (meta.etag || md5(content)) + '"'
        },
        ctx = this.context;
        // write http header and test if we need to send the content
        ctx.writeHead(200, header);
        if (ctx._statusCode === 200) {
            if (contentIsFunc) {
                content(function(data) {
                    ctx.end(data, encoding);
                });
            } else {
                ctx.end(content, encoding);
            }
        }
    }
}