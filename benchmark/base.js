// benchmark scripts copied from Class.js (TJ Holowaychuk)
var genji = require('../lib/genji').short();
var Base = genji.Base;
var sys = require('sys'),
  times = 500000;

var Benchmark = require('benchmark');

console.log('Testing class definition: ');
var suite = new Benchmark.Suite;
// add tests
suite.add('prototype', function() {
  var User = function(name) {
    if (name && typeof name === 'string') {
      this.name = name.trim();
    }
  };
  User.prototype.auth = function(username, password) {
  };
  var Admin = function(name) {
    User.call(this, name);
  };
  Admin.prototype = new User;
  Admin.prototype.constructor = Admin;
})
  .add('sys#inherits', function() {
    var User = function(name) {
      if (name && typeof name === 'string') {
        this.name = name.trim();
      }
    };
    User.prototype.auth = function(username, password) {
    };
    var Admin = function(name) {
      User.call(this, name);
    };
    sys.inherits(Admin, User);
  })
  .add('genji#base', function() {
    var User = Base(function(name) {
      if (name && typeof name === 'string') {
        this.name = name.trim();
      }
    }, {
      auth: function(username, password) {
      }
    });
    var Admin = User({
      init: function(name) {
        this._super(name);
      }
    });
  })
// add listeners
  .on('cycle', function(event, bench) {
    console.log(String(bench));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
  })
// run async
  .run({ 'async': false });


console.log('Testing class initialization: ');
var suite2 = new Benchmark.Suite;
// prototype
var UserPrototype = function(name) {
  if (name && typeof name === 'string') {
    this.name = name.trim();
  }
};
UserPrototype.prototype.auth = function(username, password) {
};
var AdminPrototype = function(name) {
  UserPrototype.call(this, name);
};
AdminPrototype.prototype = new UserPrototype;
AdminPrototype.prototype.constructor = AdminPrototype;
// sys#inherits
var UserSys = function(name) {
  if (name && typeof name === 'string') {
    this.name = name.trim();
  }
};
UserSys.prototype.auth = function(username, password) {
};
var AdminSys = function(name) {
  UserSys.call(this, name);
};
sys.inherits(AdminSys, UserSys);
// genji#base
var UserBase = Base(function(name) {
  if (name && typeof name === 'string') {
    this.name = name.trim();
  }
}, {
  auth: function(username, password) {
  }
});
var AdminBase = UserBase({
  init: function(name) {
    this._super(name);
  }
});
// add tests
suite2.add('prototype', function() {
  new AdminPrototype('zir');
})
  .add('sys#inherits', function() {
    new AdminSys('zir');
  })
  .add('genji#base', function() {
    new AdminBase('zir');
  })
// add listeners
  .on('cycle', function(event, bench) {
    console.log(String(bench));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
  })
// run async
  .run({ 'async': false });