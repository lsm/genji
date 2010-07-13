/**
 * inspired by:
 * http://rightjs.org/docs/class
 * http://ejohn.org/blog/simple-javascript-inheritance/
 */

function extend(target, modules) {
    for (var key in modules) {
        var module = modules[key];
        switch(typeof module) {
            case 'function':
                // a constructor function
                module = module.prototype;
                break;
            case 'object':
                // a module like object
                if (module.hasOwnProperty("include")) {
                    Array.isArray(module.include) ? this.include.apply(null, module.include) : this.include(module.include);
                    delete module["include"];
                }
                if (module.hasOwnProperty("extend")) {
                    Array.isArray(module.extend) ? this.include.apply(null, module.extend) : this.include(module.extend);
                    delete module["extend"];
                }
                break;
            default:
                throw new Error("Type not accepted");
        }
        for (var name in module) {
            if (typeof target[name] === "function" && typeof module[name] === "function") {
                module[name]._super_func = target[name];
            }
            target[name] = module[name];
        }
    }
    return target;
}

function su() {
    return su.caller._super_func.apply(this, arguments);
};

// copied from sys.inherits
function inherits(target, parent) {
    var tempCtor = function(){};
    tempCtor.prototype = parent.prototype;
    target.prototype = new tempCtor();
    return target;
}

var global = this;

function Base(superCtor, module) {
    if (typeof superCtor !== 'function') {
        module = superCtor;
        superCtor = function() {};
    }
    var global = this;
    
    // constructor
    var ctor = function(module) {
        // determine if current function was called directly or with a new operator
        if (this !== global) {
            // function is called in order to initialize a instance
            this.init.apply(this, arguments);
        } else {
            // ctor is called in order to define a subclass
            return Base(ctor, module);
        }
    }
    ctor.include = function() {
        extend.call(ctor, ctor.prototype, arguments);
        return ctor;
    };

    ctor.extend = function() {
        return extend.call(ctor, ctor, arguments);
    };


    ctor = inherits(ctor, superCtor);
    if(!ctor.prototype.init) {
        ctor.prototype.init = superCtor;
    }
    // extending the prototype
    module && extend.call(ctor, ctor.prototype, {'0': module});

    ctor.prototype.extend = function() {
        return extend.call(ctor, this, arguments);
    };
    ctor.prototype._super = su;
    ctor.constructor = ctor; // Class.constrcutor == Class
    ctor.prototype.constructor = ctor; // instance.constructor == Class
    return ctor;
}

module.exports = Base;