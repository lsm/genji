/**
 * Hello world example of middleware plugin
 */

/**
 * Module exports
 *
 * @type {{name: string, attach: Function}}
 * @public
 */

module.exports = {

  /**
   * Name of the plugin
   */

  name: "HelloWorld",

  /**
   * Setup function, call once during the middleware setup process
   *
   * @param core {Object} Instance of Core class
   * @param [options] {Object} middleware specific settings
   * @return {Function} Function will be called for each new request
   * @public
   */

  attach: function(core, options) {
    // push a function into the `writeHead` chain
    core.add('writeHead', function(statusCode, headers, next) {
      // do something interesting here
      statusCode = 200;
      headers['Content-Type'] = 'text/plain';
      // our job finished, passing the arguments to next function in chain
      next(statusCode, headers);
    });
    // push a function into the `end` chain
    core.add('end', function(chunk, encoding, next) {
      next('Hello World!\n', encoding);
    });

    return function(request, response, go) {
      // call the `writeHead` chain
      this.writeHead();
      // call the `end` chain
      this.end();
      // emit the event
      this.emit('helloworld');
      // go to next middleware if any
      go();
    };
  }
};