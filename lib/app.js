/**
 * Module dependencies
 */

var toArray = require('./util').toArray;
var EventEmitter = require('events').EventEmitter;
var Klass = require('./base').Klass;

/**
 * Module exports
 */

exports.App = Klass(EventEmitter, function () {
  EventEmitter.call(this);
  var self = this;
  for (var prop in self) {
    var f = self[prop];
    if ('function' === typeof f && self.isPublicMethodName(prop)) {
      self[prop] = self.publicMethods[prop] = function () {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var hasCallback = 'function' === typeof callback;

        var wrapper = function () {
          var _args = toArray(arguments);

          if (hasCallback) {
            if ('before' === self.emitInlineCallback) {
              _args.unshift(prop);
              self.emit.apply(self, _args);
              _args.shift();
            }
            callback.apply(self, _args);
          }

          if (!hasCallback || 'after' === self.emitInlineCallback) {
            _args.unshift(prop);
            self.emit.apply(self, _args);
          }
        };

        if (hasCallback) {
          args[args.length - 1] = wrapper;
        } else {
          args.push(wrapper);
        }

        f.apply(self, args);
      };
    }
  }
}, {
  emitInlineCallback: false,
  prefixDelegatedEvent: true,
  publicMethods: {},
  reservedMethodNames: Object.keys(EventEmitter.prototype).concat('init', 'isPublicMethodName'),
  isPublicMethodName: function (name) {
    return name && 'string' === typeof name && this.reservedMethodNames.indexOf(name) === -1 && name[0] !== '_';
  },
  emit: function () {
    var emitter = this.delegate || this;
    if (this.delegate && this.prefixDelegatedEvent) {
      var prefix = 'string' === typeof this.prefixDelegatedEvent ? this.prefixDelegatedEvent : this.name;
      prefix += ':';
      arguments['0'] = prefix + arguments[0];
    }
    emitter.emit.apply(this, arguments);
  }
});
