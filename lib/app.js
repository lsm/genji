/**
 * Module dependencies
 */

var toArray = require('./util').toArray;
var EventEmitter = require('events').EventEmitter;
var Klass = require('./klass').Klass;

/**
 * App constructor function
 *
 * @constructor
 */

function App() {
  EventEmitter.call(this);
  var self = this;
  self.publicMethods = {};

  for (var k in self) {
    if (self.isPublicMethodName(k)) {
      this.processPublicMethod(k);
    }
  }
}

/**
 * App prototype object
 */

App.prototype = {
  emitInlineCallback: false,
  prefixDelegatedEvent: true,
  publicMethods: null,
  reservedMethodNames: Object.keys(EventEmitter.prototype),

  /**
   * Check if given name can be used as public method name
   *
   * @param name {String} Name to check
   * @returns {boolean}
   * @public
   */

  isPublicMethodName: function (name) {
    return name && 'string' === typeof name && this.reservedMethodNames.indexOf(name) === -1 && name[0] !== '_';
  },

  /**
   * The modified emit function which prefixes event with app name if necessary
   *
   * @public
   */

  emit: function () {
    var emitter = this.delegate || this;
    var args = toArray(arguments);
    if (this.delegate && this.prefixDelegatedEvent) {
      var eventName = 'string' === typeof this.prefixDelegatedEvent ? this.prefixDelegatedEvent : this.name;
      eventName += ':' + args[0];
      args[0] = this;
      args.unshift(eventName);
    }
    EventEmitter.prototype.emit.apply(emitter, args);
  },

  /**
   * Generate default callback for each public method
   *
   * @param propName {String} Name of the property
   * @private
   */

  processPublicMethod: function (propName) {
    var self = this;
    var f = self[propName];
    if ('function' === typeof f) {
      self[propName] = self.publicMethods[propName] = (function (name, f) {
        return function () {
          var args = toArray(arguments);
          var callback = args[args.length - 1];
          var hasCallback = 'function' === typeof callback;
          var resultIsNotUndefined = false;

          var wrapper = function () {
            if (resultIsNotUndefined) {
              return;
            }
            var _args = toArray(arguments);

            if (hasCallback) {
              if ('before' === self.emitInlineCallback) {
                _args.unshift(name);
                self.emit.apply(self, _args);
                _args.shift();
              }
              callback.apply(self, _args);
            }

            if (!hasCallback || 'after' === self.emitInlineCallback) {
              _args.unshift(name);
              self.emit.apply(self, _args);
            }
          };

          if (hasCallback) {
            args[args.length - 1] = wrapper;
          } else {
            args.push(wrapper);
          }

          var result = f.apply(self, args);
          resultIsNotUndefined = 'undefined' !== typeof result;
          return result;
        };
      })(propName, f);
    }
  }
};

/**
 * Add more reserved name
 *
 * @type {Array}
 */

App.prototype.reservedMethodNames = App.prototype.reservedMethodNames.concat(Object.keys(App.prototype), 'init', 'domain', 'name');

/**
 * Module exports
 */

exports.App = Klass(EventEmitter, App);
