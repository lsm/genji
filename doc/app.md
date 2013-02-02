genji.App
=========

You define your core business logic as an `App`. Methods of the app only care about input and output, no more no less.

You can define an `App` like this: 

```javascript

  var BlogApp = App(/* instance property */ i, /* static property */ s);
 
```

Let's go deeply to see how you can implemente the business logic.

```javascript

var App = require('genji').App;


var BlogApp = App({
  
  /**
   * Constructor function
   */
  init: function(db) {// instance properties object
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
   },
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

The blog app you just defined can be used as a standalone application class. It means you don't need the http stack to run your app code. Once you get the `BlogApp` class, you construct and initialize it just like any other classes.

### Handle app result

#### Inline callback style

```javascript

var myBlog =  new BlogApp(db);

// create a blog post in db
myBlog.createPost('My awesome post', 'Some contents', function(err, result){
  // handle error and result here
});

```

#### Event style

Sometime you don't care about if the post is saved or not. And as the app instance itself is **event emitter**, you can listen the event in other part of your code.


```javascript

myBlog.on('createPost', function(err, result){
  // the event callback's argument is same as how you call the callback in the `createPost` function
  // handle the event
});

//...

// create and forget
myBlog.createPost('I do not care about the result', 'Yes, there is no callback after me.');

```

