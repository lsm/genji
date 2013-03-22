Base
====

The **base** module exports two classes

  - **Klass** is a lightweight javascript OO implementation. It only gives you a way to inherit class and nothig more.

  - **Base** is a feature rich javascript OO implementation. It supports mixin for instance/static property.

## Klass

Klass has follwoing features:

  - instance property will be overridden during subclassing
  - no reference to the parent overridden method (aka. `super`) in instance method
  - `instanceof` operator works, but `Klass` itself is not parent class of any subclass defined
  - the root super class's constructor cannot be overridden and will always be called during initialization

### Klass(SuperClass:Function, module:Object, /\*optional\*/ inherit:Function):Function

 - `SuperClass` is constructor function of your parent class
 - `module` is an object of instance properties which you want to override or add to the subclass
    - `init` is a reserved property in module object. If it's a function it will be called during initialization after SuperClass constructor function has been called. The `init` defined in parent class will be overridden by subclass just like normal property.
 - `inherit` is an optional function for changing the default inheriting behaviour
 - returns `Subclass` which you can continue to subclass by calling

   `Subclass(module:Object, /\*optional\*/ inherit:Function)`

 - the initial SuperClass constructor function (root super class) will always be called and cannot be overridden during subclassing

### Example

```javascript

  var Klass = require('genji').Klass;

  var Person = Klass(function(name){
    this.name = name;
  }, {
    getName: function(){
      return this.name;
    }
  });

  var Worker = Person({
    init: function(name) {
      this.name += ' Worker';
    },

    work: function(task) {
      return this.getName() + ' start working on ' + task;
    }
  });

  var steve = new Worker('Steve');

  var result = steve.work('writing report');

  // 'Steve Worker start working on writing report' true true
  console.log(result, worker instanceof Worker, worker instanceof Person);

```

## Base
(Coming soon)