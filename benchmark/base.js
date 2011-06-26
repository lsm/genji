// benchmark scripts copied from Class.js (TJ Holowaychuk)
var genji = require('../lib/genji').short();
var Base = genji.Base;
var sys = require('sys'),
times = 500000;
function bm(label, fn) {
    var start = +new Date
    fn()
    sys.puts('  ' + label + ' : ' + (+new Date - start) + ' ms')
}

sys.puts('\n  running ' + times + ' times\n')
sys.puts('\n  class definition \n')
bm('prototype', function(){
    var n = times
    while (n--) {
        function User(name) {
            this.name = name.trim()
        }
        function Admin(name) {
            User.call(this, name)
        }
    }
})

bm('sys.inherits()', function(){
    var n = times
    while (n--) {
        function User(name) {
            this.name = name.trim()
        }
        function Admin(name) {
            User.call(this, name)
        }
        sys.inherits(Admin, User)
    }
})

bm('Base', function(){
    var n = times
    while (n--) {
        var User = Base(function(name) {
            this.name = name.trim()
        });
        var Admin = User({
            init: function(name) {
                this._super(name);
            }
        });
    }
})

sys.puts('\n  instance creation \n')

bm('prototype', function(){
    var n = times
    function User(name) {
        this.name = name.trim()
    }
    function Admin(name) {
        User.call(this, name)
    }
    while (n--) new Admin('tj')
})

bm('sys.inherits()', function(){
    var n = times
    function User(name) {
        this.name = name.trim()
    }
    function Admin(name) {
        User.call(this, name)
    }
    sys.inherits(Admin, User)
    while (n--) new Admin('tj')
})

bm('Base', function(){
    var n = times
    var User = Base(function(name) {
        this.name = name.trim()
    });
    var Admin = User({
        init: function(name) {
            this._super(name);
        }
    });
    while (n--) new Admin('tj')
})