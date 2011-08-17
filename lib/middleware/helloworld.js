// Hello world example of middleware
module.exports = {
  // name of your middleware
  name: "HelloWorld",
  /**
   * Setup function, call once during the middleware setup process
   *
   * @public
   * @conf {Object} middleware specific settings [Optional]
   * @return {function} function will be called for each new request
   */
  make: function() {
    // push a function into the `writeHead` chain
    this.add('writeHead', function(statusCode, headers) {
      // do something interesting here
      statusCode = 200;
      headers['Content-Type'] = 'text/plain';
      // our job finished, passing the arguments to next function in chain
      this.next(statusCode, headers);
    });
    // push a function into the `end` chain
    this.add('end', function(chunk, encoding) {
      this.next('Hello World\n', encoding);
    });

    return function(req, res, go) {
      // call the `writeHead` chain
      this.writeHead();
      // call the `end` chain
      this.end();
      // go to next middleware if any
      go();
    };
  }
};