var Base = require("./base"),
    EventEmitter = require('events').EventEmitter,
    http = require("http"),
    url = require('url'),
    querystring = require('querystring'),
    cookie = require('./cookie'),
    maxPostSize = 256 * 1024,
    fs = require("fs"),
    mime = require("./mime"),
    extname = require("path").extname,
    md5 = require('./crypto').md5;

var BaseHandler = Base(EventEmitter, {
  init: function(context) {
    // call parent init/constructor
    this._super();
    // context of middleware
    this.context = context;
    this.headers = context.request.headers;
    // cookies and headers for response
    this._headers = {};
    this._cookies = [];
    this.context._statusCode = 200;
    this._headerSent = false;
    // other default settings
    this._encoding = 'utf8';
    this.maxPostSize = maxPostSize;
  },

  addHeader : function(key, value) {
    if (!this.hasHeader(key)) {
      this.setHeader(key, value);
    }
    return this;
  },

  setHeader : function(key, value) {
    this._headers[key] = value; // old value will be overwritten
    return this;
  },

  getHeader : function(key) {
    return this._headers[key];
  },

  hasHeader : function(key) {
    return this._headers.hasOwnProperty(key);
  },

  removeHeader: function(key) {
    delete this._headers[key];
    return this;
  },

  sendHeaders: function(code, headers) {
    // `headers' will overwrite `this._headers', but cookies will be kept if any.
    this._headers = headers || this._headers;
    // check if we have cookie attached
    if (this._cookies.length > 0) {
      this.setHeader('Set-Cookie', this._cookies);
    }
    this._headerSent = true;
    this.context.writeHead(code || this.context._statusCode, this._headers);
    this.context.request.method === "HEAD" && this.finish();
    return this;
  },

  setStatus : function(code) {
    if (http.STATUS_CODES.hasOwnProperty(code)) {
      this.context._statusCode = code;
      return this;
    }
    throw new Error('Unknown HTTP status code ' + code);
  },

  error : function(code, message) {
    this.sendHeaders(code || 500, {
      "Content-Type": "text/html; charset=UTF-8",
      "Content-Length": typeof message === 'string' ? Buffer.byteLength(message, 'utf8') : 0
    });
    this.finish(message, 'utf8');
  },

  redirect: function(url, permanent) {
    this._cookies = [];
    this.sendHeaders(permanent ? 301 : 302, {
      "Location": url
    }).finish();
  },

  finish: function(data, encoding) {
    var ctx = this.context;
    if (!ctx.response._headerSent && !this._headerSent) {
      ctx.writeHead(ctx._statusCode, this._headers);
    }
    if (data) {
      ctx.end(data, encoding || this._encoding);
      return;
    }
    ctx.end();
  }
});

var Simple = {
  init: function(context) {
    this._super(context);
    var self = this;
    var request = this.context.request;
    this.params = {};
    var urlObj = url.parse(this.context.request.url);
    if (urlObj.query) {
      this.params = querystring.parse(urlObj.query);
    }
    if (request.method === 'POST' || request.method === 'PUT') {
      this.on('newListener', function(name) {
        if (name === 'data') {
          var buff = '';
          request.on("data", function(chunk) {
            buff += chunk;
            if (Buffer.byteLength(buff) > self.maxPostSize) {
              self.error(500);
              self.request.removeAllListeners();
              self.request.connection.destroy();
            }
          });
          request.on("end", function() {
            self.emit('data', querystring.parse(buff), buff);
          });
        }
      });
    }
  },

  /**
   *  Send response to client in one operation
   *
   *  @param {String|Object} body Body of the http response
   *  @param {Number} [code] Http response status code, default `200`
   *  @param {Object} [headers] Http response headers, default `Content-Type, text/plain; charset=UTF-8`
   *  @param {String} [encoding] default 'utf8'
   */
  send: function(body, code, headers, encoding) {
    var body_ = body;
    headers && typeof headers === "object" && Object.keys(headers).forEach(function(name) {
      this.setHeader(name, headers[name]);
    }, this);
    if (typeof body_ !== 'string') {
      body_ = JSON.stringify(body_) || "";
    }
    this.addHeader("Content-Length", Buffer.byteLength(body_, encoding || this._encoding));
    this.addHeader("Content-Type", 'text/plain; charset=utf-8');
    this.sendHeaders(code);
    this.finish(body_, encoding);
  },

  sendJSON: function(data) {
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.send(data);
  },

  sendHTML: function(data) {
    this.setHeader('Content-Type', 'text/html; charset=utf-8');
    this.send(data);
  }
};

var Cookie = {
  setCookie: function(name, value, options) {
    var cookieString = cookie.stringify(name, value, options);
    if (!Array.isArray(this._cookies)) {
      this._cookies = [];
    }
    this._cookies.push(cookieString);
  },

  getCookie: function(name) {
    if (!this.headers.cookie) return null;
    if (!this.cookies) { // request cookie will be parsed only one time
      this.cookies = cookie.parse(this.headers.cookie);
    }
    return this.cookies[name];
  },

  clearCookie: function(name, options) {
    options = options || {};
    options.expires = new Date(+ new Date - 30 * 24 * 60 * 60 * 1000);
    this.setCookie(name, "", options);
  }
};

var File = {

  /**
   * Read the file stream to the client
   *
   * @param {String} filePath Absolute path of the file
   * @param {String} [etag] Set the etag other than generate from inode info
   * @param {Function} [errback] Error handling function, default response 404 to the client
   */
  staticFile: function(filePath, etag, errback) {
    var self = this, ctx = this.context;
    if (typeof etag === "function") {
      errback = etag;
      etag = null;
    }
    var errback_ = function (err) {
      (errback || function(err) {
        self.error(404, 'File not found');
        console.error(err.stack || err);
      }).call(self, err);
    };

    fs.stat(filePath, function(err, stat) {
      if (err || !stat.isFile()) {
        errback_(err || filePath + ' is not a file');
        return;
      }

      var contentType = mime.lookup(extname(filePath));
      ctx.writeHead(200, {
        'content-type': contentType,
        'content-length': stat.size,
        'etag': '"' + (etag || md5(stat.size + '-'
            + stat.ino + '-' + Date.parse(stat.mtime))) + '"'
      });

      if (ctx._statusCode !== 200) return;
      // read file only no one alter the status code
      fs.createReadStream(filePath, {'encoding': 'binary'})
          .on('data', function(data) {
            ctx.write(data, 'binary');
          })
          .on('end', ctx.end)
          .on('error', errback_);
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
    var meta_ = meta || {};
    var encoding = meta_.encoding || 'binary',
        header = {
          'content-type': meta_.type || mime.lookup(meta_.ext || ''),
          'content-length': meta_.length || Buffer.byteLength(content, encoding),
          'etag': '"' + (meta_.etag || md5(content)) + '"'
        },
        ctx = this.context;
    // write http header and test if we need to send the content
    ctx.writeHead(200, header);
    if (ctx._statusCode === 200) {
      if (typeof content === 'function') {
        content(function(data) {
          ctx.end(data, encoding);
        });
      } else {
        ctx.end(content, encoding);
      }
    }
  }
};

// exports separatly, make it easy to redefine your own handler class
exports.BaseHandler = BaseHandler;
exports.Simple = Simple;
exports.Cookie = Cookie;
exports.File = File;
// exports the default one
exports.Handler = BaseHandler(Simple).include(Cookie, File);