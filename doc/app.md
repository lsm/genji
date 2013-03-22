App
===

An app is a `class` where you define and implement your core business logic. App it self is an event emitter.
Properties can be overridden by subclassing existent app.

## Define app

You can define an `App` like this:

```javascript

  var App = require('genji').App;
  var BlogApp = App(/* instance properties */ properties);

```

Let's go through a simple example to see how we can define an app.

```javascript

var App = require('genji').App;

var BlogApp = App({// instance properties object
    /**
     * Name of your app
     */
    name: 'Blog',

    /**
     * App constructor function
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
      // save to the db
      this.db.save(post).then(function(result){
        // error first callback style
        callback(null, result);
      });
    }
  });
```

The `BlogApp` you just defined can be used as a standalone application class. It means you don't need the http stack to run your app code. Once you get the `BlogApp` class, you initialize and use it just like any other classes. The `init` function will be called on initialization and it's optional.

## Handle result

There are two different ways to handle result of the instance function. One is to add callback as the last argument and
handle result inline. Another is to listen to the event emitted from object of app instance.

### Inline callback style

```javascript

var myBlog =  new BlogApp(db);

// create a blog post in db
myBlog.createPost('My awesome post', 'Some contents', function(err, result) {
  // handle error and result here
  // this == myBlog, so you can emit event manually
  this.emit('createPost', err, result);
});

```

### Event style

**Default callback**

Sometime you don't care about if the post is saved or not. And you may wish to handle the result in other part of your code.
So when you call instance function and the last argument is not a callback, genji will generate a default callback for you.
You call the callback as usual and an event with the name of the instance method will be triggered.

```javascript

// the event callback's argument is same as how you call the callback inside the "createPost" function
myBlog.on('createPost', function(err, result) {
  // handle the event
});

//...

// create and forget
myBlog.createPost('I do not care about the result', 'Yes, there is no callback after me.');

```

There is one **exception**. When your instance function is synchronized and returns non-undefined value on calling. The event/callback will not be emitted/invoked in async operation.

```javascript

  getDB: function(cb) {
    cb(); // will call `theCallback`, if no callback gived event will be emitted
    process.nextTick(function(){
      cb(); // `theCallback` will not be called end emit event
    });
    return this.db;
  }

  function theCallback() {
    // this function will never be called in async operation
  }

  var db = myBlog.getDB(theCallback);

```

**Delegation**

You can delegate all the events to other event emitter object by setting the `delegate` property to that emitter.

```javascript

var otherEmitter = new EventEmitter();

myBlog.delegate = otherEmitter;

// event name will be prefixed by app name on delegation by default
otherEmitter.on('Blog:createPost', function(err, result) {
  // handle the event
});

myBlog.on('createPost', function(err, result) {
  // this will never be called as you allready delegate events to `otherEmitter`
});

myBlog.createPost('title', 'content');

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

App introduced a very thin mechanism to organize business logic code. To make app works simply and efficiently with
other part of system, here are the conventions you may need to know and understand.

### Session

Although we call defined app `class`, but actually we use individial instance functions in a `functional programming`
style in conjuction with [Site](site.html) and [Router](router.html). This allow genji to reuse a single app instance
for multiple requests instead of constructing for each one of them. You may noticed that, there's no session info passed
to `createPost` in the above example, this is not possible in a real world application. So Genji put the session object
which may contains credential or other user specific info as the first argument of app's instance function when working
with Site. So your instance function will have some sort of `session first callback last` style of function signature.

```javascript

createPost: function(session, title, content, callback) {
  if (session.group === 'author' && session.user) {
    // Make the post object with user info
    var post = {
      user: session.user,
      title: title, content: content, created: new Date()
    };
    this.db.save(post).then(function(result){
      callback(null, result);
    });
  } else {
    // do something
  }
}

```

To make the app class more reusable, don't put any http stack object as the function argument
(e.g. request/response object of node.js etc.). That will make you loose the flexiblity and coupled with http stack.
Leave that job to `genji.Site` to make you life easier.

### The `this` object

You can always use `this` refer to the instance of app inside of instance function, callback function and event listening function.


### Naming and url mapping

Site use `name` property of app and it's functions' name for mapping url automatically. For example:

 - `blog/ceate/post` to match `Blog` app's `createPost` function.
 - `awesomeblog/create/post` map to `AwesomeBlog`'s `createPost`.
 - `blog/camel/cased/function/name` to match `Blog`'s `camelCasedFunctionName` function.
 - if the function name start with low dash `_` (e.g. `_privateFunc`), no url will map to this function.

### Error first callback style

We follow the native node.js api's callback style, which put the error object at the first argument of a callback function. It's true for the event listening function as well.

## API

`App` is exposed by `require('genji').App`. Inherits from EventEmitter.

### Properties

  - `name` is the name of your app in *string*, name should be upper camel case.

  - `emitInlineCallback` is an enum value ('after', 'before', false) which tells genji automatically emit event `after`/`before` callback is called when you handle result inline. Default is boolean `false` which means not to emit.

  - `prefixDelegatedEvent` is an enum value indicates whether or not to prefix the event name when using `delegate` as emitter:
      - `true` event name will be prefixed, the prefix is `'name of app' + ':'` (e.g. `createPost` -> `Blog:createPost`). This is the default value
      - `false` not to prefix
      - Any non-empty *string* value as customized prefix

  - `publicMethods` is an *object* of functions created upon initialization which considered as public methods, `controller` uses this property to map url to function.

  - `reservedMethodNames` is an *array* of reserved names which cannot be used as public method, the default value is:

      ```
        ["setMaxListeners","emit","addListener","on","once","removeListener","removeAllListeners","listeners", "init", "isPublicMethodName"]
      ```

  - `site` is the `site` instance when works with `genji.site` is optional but reserved

### Methods

  - `init` is the constructor *function*, it will be called once and only once at the time of initialization, you should not call it manually.

  - `isPublicMethodName` is a *function* use to check if a string can be used as public method name or not. The default rule is:

      The name must be a non-empty string and must not equal to one of the `reservedMethodNames` and not start with lower dash `_`.

