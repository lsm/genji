genji.App
=========

An app is a `class` where you define and implement your core business logic. App can have instance property and static property. Properties can be overrode by subclassing existent app.

## Define an app

You can define an `App` like this:

```javascript

  var BlogApp = App(/* instance property */ i, /* static property */ s);
 
```
Let's go through a simple example to see how we can define an app.

```javascript

var App = require('genji').App;

var BlogApp = App({// instance properties object
    /**
     * name of your app
     */
    name: 'Blog',
    
    /**
     * Constructor function
     */
    init: function(db) {
      this.db = db;
    },

    /**
     * Create a blog post
     */
    createPost: function(title, content, callback) {
      // Make the post object
      var post = {title: title, content: content, created: new Date()};
      // call static function
      post.weekday = BlogApp.weekdayOfDate(post.created);
      // save to the db
      this.db.save(post).then(function(result){
        // error first callback style
        callback(null, result);
      });
    }
  }, {// the static properties object

    /**
     * Convert a date object to a weekday string
     */
    weekdayOfDate: function(date) {
      // your code here
      // return weekday;
    }
  });

```

The `BlogApp` you just defined can be used as a standalone application class. It means you don't need the http stack to run your app code. Once you get the `BlogApp` class, you initialize and use it just like any other classes. The `init` function will be called on initialization and it's optional.

## Handle app result

#### Inline callback style

```javascript

var myBlog =  new BlogApp(db);

// create a blog post in db
myBlog.createPost('My awesome post', 'Some contents', function(err, result) {
  // handle error and result here
  // you can still emit the event
  this.emit(err, result);
});

```

#### Event style

Sometime you don't care about if the post is saved or not. And as the app instance itself is **event emitter**, you can listen the event in other part of your code. Actually, if the last arguments is not a function, genji will generate one for you to do the emit job.


```javascript
// the event callback's argument is same as how you call the callback in the `createPost` function
myBlog.on('createPost', function(err, result){
  // handle the event  
});

//...

// create and forget
myBlog.createPost('I do not care about the result', 'Yes, there is no callback after me.');
```

Sometime it makes sense to let other object to handle all the events. You can delegate all the events to other event emitter object by setting the `delegate` property to that object.

```javascript

var otherEmitter = new EventEmitter();

myBlog.delegate = otherEmitter;

otherEmitter.on('createPost', function(err, result) {
  // handle the event
});

myBlog.on('createPost', function(err, result) {
  // this will never be called as you allready delegate events to `otherEmitter`
});

```

## Extending

It's easy to extend an existent app class, use the app class you want to extend just like you use `App`:

```javascript

var AwesomeBlogApp = BlogApp({
    
    name: 'AwesomeBlog',

    createPost: function(title, content, callback) {
      // ...
    },

    getPost: function(id, callback) {
      // ...
    }
  });

```

## Conventions

App introduced a very thin mechanism to organize business logic code. To make the app works simple and efficient with other part of system, here are the conventions you may need to know and understand.

#### Context

Although we call defined app `class`, but actually we use individial instance functions in a `functional programming` style in conjuction with `genji.Controller`. This allow genji to reuse a single app instance for multiple requests instead of constructing for each one of them. You may noticed that, there's no session info passed to `createPost` in the above example, this is not possible in a real world application. So we put the context object which contains session and other request specific info as the first argument of app's instance function when working with controller. So your instance function will become some sort of `context first callback last` style of function signature:

```javascript

createPost: function(context, title, content, callback) {
  if (context.group === 'admin' && context.user) {
    // Make the post object with user info
    var post = {
      user: context.user,
      title: title, content: content, created: new Date()
    };
    // call static function
    post.weekday = BlogApp.weekdayOfDate(post.created);
    // save to the db
    this.db.save(post).then(function(result){
      // error first callback style
      callback(null, result);
    });
  } else {
    // do something
  }
}

```

To make the app class more reusable, don't put any http stack object as the function argument (e.g. request/response object of node.js etc.). That will make you loose the flexiblity and coupled with http stack.
Leave that job to `genji.Controller` to make you life easier.

#### The `this` object

You can always use `this` refer to the instance of app inside of instance function, callback function and event listening function.


#### Naming and url mapping

Controller use app name and it's functions' name for mapping url automatically. For example:

 - `blog/ceate/post` to match `Blog` app's `createPost` function.
 - `awesomeblog/create/post` map to `AwesomeBlog`'s `createPost`.
 - `blog/camel/cased/function/name` to match `Blog`'s `camelCasedFunctionName` function.


#### Error first callback style

We follow the native node.js api's callback, which put the error object at the first argument of a callback function. It's true for the event listening function as well.

#### Other reserved properties

- `init` the constructor function, it will be called once and only once at the time of initilization, you can not call it manually.

- `emitCallback` an enum value ('after', 'before', false) which tells genji automatically emit event `after`/`before` callback is called when you handle result inline. Default is boolean `false` which means not to emit.


