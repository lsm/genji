
var Factory = function(defs) {
    if (defs) {
        for (var i = 0; i < defs.length; i++) {
            this.register.apply(this, defs[i]);
        }
    }
};

Factory.prototype = {
    register: function(name, creator, parameters, singleton) {
        if (singleton) {
            var instance = creator.apply(null, parameters);
            this.__defineGetter__(name, function() {
                return instance;
            });
        } else {
            var def = arguments;
            this.__defineGetter__(name, function() {
                return def.creator.apply(null, def.parameters);
            });
        }
    }
};

module.exports = Factory;