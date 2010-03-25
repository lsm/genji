/**
 * inspired:
 * http://rightjs.org/docs/class
 * http://ejohn.org/blog/simple-javascript-inheritance/
 */
;
(function() {
	var global = this, initializing = true;

	var Base = function() {
		// @todo directly call new Base() should not be allowed
		var extend = function(target, modules) {
			Object.keys(modules).forEach(function(idx) {
				var module;
				if (typeof modules[idx] === "function") {
					// a constructor function
					module = modules[idx].prototype;
				} else if (typeof modules[idx] === "object") {
					module = modules[idx];
					// a module like object
					if (module.hasOwnProperty("include")) {
						Array.isArray(module.include) ? ctor.include.apply(null, module.include) : ctor.include(module.include);
						delete module["include"];
					}
					if (module.hasOwnProperty("extend")) {
						Array.isArray(module) ? ctor.extend.apply(null, module.extend) : ctor.extend(module.extend);
						delete module["extend"];
					}
				} else {
					throw new Error("Type not accepted");
				}
				Object.keys(module).forEach(function(name) {
					if (typeof target[name] === "function" && typeof module[name] === "function") {
						module[name]._super_func = target[name];
						target[name] = module[name];
					} else {
						target[name] = module[name];
					}
				});
			});
		};

		// constructor
		var ctor = function() {
			// determine if current function was called directly or with a new operator
			if (this !== global) { // @todo better solution that don't need global
				// function is called in order to initialize a instance
				if (typeof this.init === "function" && initializing) this.init.apply(this, arguments);
			} else {
				// ctor is called in order to define a subclass
				return Base(arguments.callee, arguments[0]);
			}
		}

		ctor.include = function() {
			extend(ctor.prototype, arguments);
		};

		ctor.extend = function() {
			extend(ctor, arguments);
		};

		// instance
		if (typeof arguments[0] === "function") {
			initializing = false;
			// @todo deal with the constructor function not defined by Base
			ctor.prototype = new arguments[0];
			initializing = true;
			delete arguments[0];
		}
		extend(ctor.prototype, arguments);
        
		ctor.prototype._super = function() {
			var _super = arguments.callee.caller._super_func;
			if (typeof _super === "function") {
				return _super.apply(this, arguments);
			}
			throw new Error("_super function not exists");
		};

		ctor.prototype.extend = function() {
			extend(this, arguments);
		};
        
		ctor.constructor = ctor; // Class.constrcutor == Class

		return ctor;
	}
	exports.Base = Base;
})();