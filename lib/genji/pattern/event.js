var Base = require("./base");
var EventEmitter = require("events").EventEmitter;

var Event = Base(EventEmitter, {
	on : function() {
		switch(typeof arguments[0]) {
			case "string":
				this._super(arguments[0], arguments[1]);
				break;
			case "object":
				Object.keys(arguments[0]).forEach(function(name) {
					this.on(name, arguments[0][name]);
				}, this);
				break;
            default:
				throw new Error("First argument should be string or object defined the event/callback.");
		}
	},
    
	// after emit this event, all listeners of current type will be removed
	last: function() {
		if (this.listeners(arguments[0]).length > 0) {
			this.emit.apply(this, arguments);
            this.removeAllListeners(arguments[0]);
		}
	},

	// this event can only have one callback, subsequential one() called will overwrite the old one
	one: function(type, listener) {
		this.removeAllListeners(type);
        this.addListener(type, listener);
		return this;
	},
    
	off: function(type, func) {
        func ? this.removeListener(type, func) : this.removeAllListeners(type);
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
				this.emit.apply(this, arg);
				break;
			default:
				throw new Error("input should be either a function or a string (event name)");
		}
	}
});

module.exports = Event;