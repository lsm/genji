var Base = require("./base").Base;
var EventEmitter = require("events").EventEmitter;
var d = require('../utils').debug;

// @todo do we need event filter?
// @todo Event has a `emitter'?
var Event = Base(EventEmitter, {
	init: function() {
		EventEmitter.call(this); // call parent constructor
	},
    
	on : function() {
		switch(typeof arguments[0]) {
			case "string":
				this.addListener(arguments[0], arguments[1]);
				break;
			case "object":
				Object.keys(arguments[0]).forEach(function(name) {
					this.addListener(name, arguments[0][name]);
				}, this);
				break;
		}
	},
    
    fire : EventEmitter.prototype.emit,
    
	// after emit this event, all listeners of current type will be removed
	last: function() {
		if (this.listeners(arguments[0]).length > 0) {
			this.fire.apply(this, arguments);
			this.off(arguments[0]);
		}
	},

	// this event can only have one callback, subsequential one() called will overwrite the old one
	one: function(type, listener) {
		this.off(type).on(type, listener);
		return this;
	},
    
	off: function(type) {
		if (this._events.hasOwnProperty(type)) {
			delete this._events[type];
		}
		return this;
	},

	callOrFire: function() {
		var todo = arguments[0],
		arg = Array.prototype.slice.call(arguments, 1);
		switch(typeof todo) {
			case "function" :
				todo.apply(null, arg);
				break;
			case "string" :
				arg.unshift(todo);
				this.fire.apply(this, arg);
				break;
			default:
				throw new Error("input should be either a function or a string (event name)");
		}
	}
});

exports.Event = Event;

/* vim:tabstop=4:expandtab:sw=4:softtabstop=4
*/