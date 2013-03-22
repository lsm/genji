Site
====

**Site** is the organizer for your applications. And using **Site** is the recommended way to use Genji when you have a
large/complex project. It has the following features:

- It inherits `EventEmitter`
- It has setter/getter methods which can be used to save and retrieve `settings`
- It can load and expose your `app` to external world and manage maps between url and app function
- It works with [Core](core.html) - the `plugin` system
- It works with `view` and renders result by convention
- Settings, plugins and apps are all namespaced by `env`

A `site` object can be created by calling `genji.site()`:

```javascript
var mySite = genji.site();
```

## Getter/Setter

You can use `mySite` to set and get settings.

```javascript

mySite.set('title', 'My Great Website');

// 'My Great Website'
var title = mySite.get('title');

// set a batch of settings
mySite.set({
  host: '127.0.0.1',
  port: 8888
});

// get a batch of settings
var settings = mySite.get(['title', 'host', 'port']);
// {title: 'My Great Website', host: '127.0.0.1', port: 8888}

```

## Use middleware

You don't have to initialize [middleware manager](#core.html) by yourself when you use site. You only need to call `use` method of the
site instance.

```javascript

// use built-in middlewares
mySite.use('conditional-get');
mySite.use('logger', conf);

// use custom middleware

mySite.use(function(core, conf) {
    // do something
  }, conf);
```

## Load app

Using app with site is as simple as middleware. But instead of `use` you need to call `load` with app instance.

```javascript

var blog = new BlogApp();
mySite.load(blog);

// site instance will be setted to app instance's `delegate` property
// blog.delegate === mySite

```

If you have a lots of apps which have similar initializing options. Then you can set the default app options and let
site initialize them for you.

```javascript
var options = {x: 1, y: 2};
mySite.set('appOptions', options);
mySite.load(BlogApp);
mySite.load(MyOtherApp);
```

The default options could be overridden and inherited.

```javascript
var someOptions = {y: 3, z: 2};
// the actual intializing option is {x: 1, y: 3, z: 2}
mySite.load(SomeApp, someOptions);
// load three apps at once
mySite.load([SomeApp1, SomeApp2, SomeApp3], someOptions);

```

## Routing

All methods in the `app.publicMethods` property will be mapped to url by default follows the [convention](app#naming-and-url-mapping).
For example, the `blog.createPost` will be mapped to url that matches `^/blog/create/post` by default.
Of course, if the default convention/mapping does not meet your needs, you can use the `map` function to map individual
url to app method and override the default options.

```javascript

mySite.map({
  // handle `POST` requests for url '/blog/create/post'
  blogCreatePost: {method: 'post'}
  // handle both `GET` and `POST` requests for url '/blog/read/post/:id'
  blogReadPost: {url: '^/blog/read/post/[0-9]{16}'},
  // add hooks
  blogUpdatePost: {method: 'put', hooks: [preFn1, null, postFn1]}
});

```

If you have predefined routing definition object, you can load it at the same time when loading app.

```javascript

var routes = {
  // it's an app default settings if the property key of the route is one of the app's name (in lower case)
  blog: {hooks: [fn1, null, fn2], method: 'get', urlRoot: '^/blog/'},
  blogReadPost: {url: '^/blog/read/post/[0-9]{16}'},
  // a comprehensive route definition
  blogCreatePost: {
    url: '/create/post',
    method: 'post',
    hooks: [fn3, fn4, null, fn5],
    view: 'json' // see [Output result](#output-result)
  }
};

mySite.load(AnotherApp, someOptions, routes);
```

The `routes.blog` object holds default settings for all `publicMethods` of `blog` instance. It means if some setting is
not specified in route, it will use the default one provided by `routes.blog`. And hooks will be combined. So the final
routes of above example normalized by genji would be:

```javascript
var routes = {
  blogReadPost: {
    url: '^/blog/read/post/[0-9]{16}',
    method: 'get',
    hooks: [fn1, null, fn2],
    view: 'html' // site default value, see [Output result](#output-result)
  },
  // a comprehensive route definition
  blogCreatePost: {
    url: '^/blog/create/post',
    method: 'post',
    hooks: [fn1, fn3, fn4, null, fn5, fn2],
    view: 'json' // see [Output result](#output-result)
  }
};
```

## Output result

We already knew how to map a url to an app's method. Let's see how we can output the result.

  - Output the result as html string (default):

```javascript

  blogReadPost: {url: '^/blog/read/post/[0-9]{16}', view: 'html'}

```

  - Output the result as json string:

```javascript

  blogReadPost: {url: '^/blog/read/post/[0-9]{16}', view: 'json'}

```

  - Handle result by customized function:

```javascript

  blogReadPost: {url: '^/blog/read/post/[0-9]{16}', view: function(err, result) {
    if (err) {
      this.error(err);
      return;
    }
    this.sendJSON(result);
  }}

```

When you use genji's `view` system, site can render view template automatically for you.

```javascript

var hogan = require('hogan.js');
mySite.use('view', {engine: hogan, rootViewPath: __dirname});

mySite.map({

  // render template file at "rootViewPath + /blog/views/read_post.html"
  blogReadPost: {url: '^/blog/read/post/[0-9]{16}', view: '/blog/views/read_post.html'},

  // the default behavior is try to find a template file at "rootViewPath + /blog/update_post.html" if you use the view system
  blogUpdatePost: {method: 'put'}

});

```

Of course, it's possible to do some tweaks and render manually.

```javascript

  blogUpdatePost: {method: 'put', view: function(err, result) {
    result.someValue = 1;

    // auto template file discovery, render and send
    this.render(result);

    // or indicates template view name manually
    this.render('blog/update_post.html', result);

    var self = this;
    // or render and send manually
    this.render('/path/to/blog/views/update_post.html', result, function (err, html) {
      self.sendHTML(html);
    });
  }}

```

## Environment

By using `env` you can have different settings, middlewares and apps for different environments. The default environment
named `default`.

```javascript

// switch to environment "dev"
mySite.env('dev');

// the following title and middleware will be used if your 'process.env.NODE_ENV' === 'dev'
mySite.set('title', '[DEV] My Great Website');
mySite.use('dev-verbose', 'all');
// the "DevApp" is also only avaliable for "dev" environment
mySite.load(DevApp);

// switch back to the 'default' environment
mySite.env(); // or mySite.env('default')

```

The `dev` environment inherits `default`. It means all settings, middlewares and apps setted before you switched to `dev`
are also setted/used/loaded. So when you switched to new environment, `set/use/load` overrides the differences.

## Start your site

Start the server is easy

 ```javascript

 mySite.start();

 ```