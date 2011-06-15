/**
 * Factory with singleton support
 *
 */

/**
 * @constructor
 *
 * @param {Array} defs Group of factories you want to register
 *
 */
var Factory = function(defs) {
	if (defs) {
		for (var i = 0; i < defs.length; i++) {
			this.register.apply(this, defs[i]);
		}
	}
};

Factory.prototype = {

	/**
	 * Register an object
	 *
	 * @param {String} name Name of the object
	 * @param {Function} creator Constructor function
	 * @param {Array} parameters Parameters used by constructor function
	 * @param {Boolean} singleton If the object is singleton or not
	 */
	register: function(name, creator, parameters, singleton) {
		if (singleton) {
			var instance = creator.apply(null, parameters);
			this.__defineGetter__(name, function() {
				return instance;
			});
		} else {
			var def = {creator: creator, parameters: parameters};
			this.__defineGetter__(name, function() {
				return def.creator.apply(null, def.parameters);
			});
		}
	},

	/**
	 * Register a constructor
	 *
	 * @param {String} creatorName Name of the constructor
	 * @param {Function} creator Constructor function
	 */
	regCreator: function(creatorName, creator) {
		var self = this;
		this.__defineGetter__(creatorName, function() {
			return function(name, parameters, singleton) {
				self.register(name, creator, parameters, singleton);
			}
		});
	}
};

module.exports = Factory;