// inspired by http://github.com/quirkey/node-logger

/**
 * Module dependencies
 */
var util = require('util');


module.exports = {
  name: 'Logger',
  make: function(conf) {
    var levels = ['fatal', 'error', 'warn', 'info', 'debug'],
        defaultLevel = levels.indexOf(conf.level || 'info'),
        log = util.log;
    if (defaultLevel === -1) {
      throw new Error('Loggin level `' + conf.level + '` not exists.');
    }

    this.addListener('log', function(level) {
      var args = Array.prototype.slice.call(arguments), msg = '';
      level = level.length > 5 ? -1 : levels.indexOf(level);
      if (level === -1) {
        level = defaultLevel;
      } else {
        args.shift();
      }
      if (level <= defaultLevel) {
        args.forEach(function(arg) {
          if (!arg) return;
          if (typeof arg === 'string') {
            msg += ' ' + arg;
          } else {
            msg += ' ' + util.inspect(arg, false, null);
          }
        });
        log(levels[level] + ': ' + msg);
      }
    });
    // this middleware is available as an event listener of the flaker.
    // no need to alter things on each request, return false;
    return false;
  }
};