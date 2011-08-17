// ported from django
module.exports = {
  name: 'ConditionalGet',
  make: function() {
    this.add('writeHead', function(statusCode, headers) {
      if (this.context.omitConditionalGet === true) {
        this.next(statusCode, headers);
        return;
      }

      if (statusCode == 304) {
        // 304 already setted by upstream filter/handler, go next to avoid conflict
        this.next(statusCode, headers);
        return;
      }
      var etag = headers.etag,
          lastModified = headers['last-modified'];
      if (etag && etag === this.context.noneMatch) {
        statusCode = 304;
      } else if (lastModified && lastModified === this.context.modifiedSince) {
        statusCode = 304;
      }
      if (statusCode === 304) {
        // 304 is setted by current filter, write to the client directly, response end.
        delete headers['content-length'];
        this.context._statusCode = 304; // let other know we've changed the status
        this.response.writeHead(statusCode, headers);
        this.response.end();
        return;
      }
      this.next(statusCode, headers);
    });

    return function(req, res, go) {
      var noneMatch = req.headers['if-none-match'],
          modifiedSince = req.headers['if-modified-since'];
      if (!(req.method === "GET" && (modifiedSince || noneMatch))) {
        // tell my flake defined above, that it shouldn't be called in this session
        this.omitConditionalGet = true;
      } else {
        // inject request specific informations into context,
        // so that our prepared function chains can get the correct info.
        this.noneMatch = noneMatch;
        this.modifiedSince = modifiedSince;
      }
      go();
    };
  }
};