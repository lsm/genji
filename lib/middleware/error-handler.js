module.exports = {
  name: 'ErrorHandler',
  make: function(conf) {
    var self = this;
    this.addListener('error', function(err) {
      // @todo what if no one is listening to `log`
      if (err.exception) {
        // we got exception
        self.emit('log', 'fatal', err.exception.stack || err.exception.message);
      } else if (err.code) {
        // user defined error
        self.emit('log', 'error', err.code, err.message);
      }
    });
    if (conf.uncaughtException) {
      process.on('uncaughtException', function(err) {
        self.emit('log', 'fatal', '[uncaughtException] ' + err.stack || err.message || err);
      });
    }
    // this middleware is available as an event of the flaker.
    // no need to alter things on each request, return false;
    return false;
  }
};