/**
 * inspired by:
 * http://rightjs.org/docs/class
 * http://ejohn.org/blog/simple-javascript-inheritance/
 */
var slice = Array.prototype.slice;
var p = require('sys').puts;
;
(function() {
    var global = this;
    exports.Base = function Base(superCtor, module) {
        if (typeof superCtor !== 'function') {
            throw new Error('Your must supply a constructor function.');
        }
        // constructor
        var ctor = function(module) {
            // determine if current function was called directly or with a new operator
            if (this !== global) {
                var args = slice.call(arguments);
                // function is called in order to initialize a instance
                if (typeof this.init === "function") {
                    // call user-defined constructor
                    this.init.apply(this, args);
                }
            } else {
                // ctor is called in order to define a subclass
                return Base(ctor, module);
            }
        }
        var extend = function(target, module) {
            for (var name in module) {
                if (typeof target[name] === "function" && typeof module[name] === "function") {
                    module[name]._super_func = target[name];
                }
                target[name] = module[name];
            }
        }
        // copied from sys.inherits
        var tempCtor = function(){};
        tempCtor.prototype = superCtor.prototype;
        ctor._super = superCtor;
        ctor.prototype = new tempCtor();
        // extending the prototype
        extend(ctor.prototype, module);
        
        ctor.prototype._super = function su() {
            var _super = su.caller._super_func;
            if (typeof _super === "function") {
                return _super.apply(this, arguments);
            }
            throw new Error("_super function not exists");
        };

        if (typeof ctor.prototype.init === 'function') {
            if (! ctor.prototype.init._super_func)
                ctor.prototype.init._super_func = superCtor;
        } else {
            // force link the `init` constructor to superCtor
            ctor.prototype.init = superCtor;
        }
        
        ctor.constructor = ctor; // Class.constrcutor == Class
        ctor.prototype.constructor = ctor; // instance.constructor == Class
        return ctor;
    }
})();

;
(function() {
    var global = this, initializing = true;

    var Class = function() {
        // @todo directly call new Class() should not be allowed
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
                    }
                    target[name] = module[name];
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
                return Class(ctor, arguments[0]);
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
            // @todo deal with the constructor function not defined by Class
            ctor.prototype = new arguments[0];
            initializing = true;
            delete arguments[0];
        }
        extend(ctor.prototype, arguments);
        
        ctor.prototype._super = function su() {
            var _super = su.caller._super_func;
            if (typeof _super === "function") {
                return _super.apply(this, arguments);
            }
            throw new Error("_super function not exists");
        };

        ctor.prototype.extend = function() {
            extend(this, arguments);
        };
        
        ctor.constructor = ctor; // Class.constrcutor == Class
        ctor.prototype.constructor = ctor; // instance.constructor == Class

        return ctor;
    }
    exports.Class = Class;
})();