Router
======

Router routes http request to designated handling function based on the requesting url.
It parses http GET and POST variables and supports calling hook function before/after dispatch to handling function.
Router can be used standalone which means no site/middleware/app involved.

## Usage

```javascript
  var genji = require('genji');

  var router = genji.route({urlRoot: '/home'});

  // handle GET request for url '/home/hello?title=Mr'
  router.get('/hello/(.*)', function(handler, name, query) {
    // query string will be parsed and placed as the second argument
    handler.sendHTML('Hello, ' + query.title + ' ' + name);
  });

  // 'urlRoot` will not be prefixed before your url if it starts with '^'
  router.post('^/post', function(handler, query) {
    // post parameters will be parsed if handler listen to the 'params' event.
    handler.on('params', function(params) {
      // do something
      handler.send('ok');
    });
  });

  function preHook(handler, next) {
    setTimeout(next, 1000);
  }
  router.get('/pre_hooked', function() {}, {preHook: preHook});

  // bind
  var server = router.listen(8888, '127.0.0.1');
```

For using with `site` see ...

## API

`Router` exposed by `require('genji').Router`. Instance can be created by

    var router = require('genji').route(options);

### genji.route(options:Object)

Takes **optional** options and create a new `genji.Router` instance.

Supported options:

 - `urlRoot` is the base url of the router, default value is '^/'.
 - `handlerClass` the default handler class for each request. See [Handler](#handler) for more info.

### Methods

#### Router#{get|post|put|delete|head}(url:{String|RegExp}, handleFunction:Function, /\*optional\*/ options:Object)

The `get/post/put/delete/head` routing methods of `Router` instance have the same signature:

  - `url` The RegExp instance or string representation of it, string will be converted to regular expression
    If it's string, router will check if the given string starts with `^` if not the `urlRoot` will be prepended to the string.
    This is not true for RegExp object.
  - `handleFunction` Function to handle the request, the handling function has following signature:
    function handleFunction(handler, /\*optional\*/ matched..., /\*optional\*/ query) {}
    - `handler` Instance of `Handler` object
    - `matched` *Optional* arguments matched from your url regular expression (e.g. /path/to/item/**([0-9]\*)** )
    - `query` *Optional* query object parsed from url (e.g. /path/to/item?**id=1234**)
  - `options` An optional object for advanced customization:
    - `handlerClass` custom handler for this specific rule
    - `preHook` a function or array of functions which will be called before dispatch to handling function
    - `postHook` a function or array of functions which will be called after dispatch to handling function

Routing rules are grouped by http method. Previous rule could be overriden by subsequently calling routing method with same
http method and url. That means you can have different handling functions for the same url with different http method.

#### Router#mount(urls:{Array})

Add batch of routing rules at once. Each element in the `urls` array should be an array with members of following order:

  - `url` same as described above in `get/post/put/delete/head` methods
  - `handleFunction` same as described above
  - `httpMethod` *Optional* http method that accepted, default to 'GET'
  - `options` *Optional* same as described above

#### Router#notFound(url:{String|RegExp}, handleFunction:Function)

The missing match matcher. You can use it to handle miss matched requests based on different url.

```javascript

  router.notFound('^/blog/*', function(handler) {
    // for miss matched url start with `/blog/`
  });

  router.notFound('^/*', function(handler) {
    // for any other cases
  });

```

#### Router#route(type:String, url:String, context:Object, /\*optional\*/ notFound:Function):Boolean

The routing function, it takes input and try to match with existent rules. Return `true` on matched otherwise `flase`.

  - `type` is type of request `GET|POST|PUT|DELETE|HEAD|NOTFOUND`
  - `url` is the request url
  - `context` is the `this` object for dispatching
  - `notFound` is a function will be called when no rule matched the given input

#### Router#{preHook|postHook}(fn:{Function|Array})

Add pre/post hook(s) to all existent url routing rules in the current router instance.

#### Router#listen(server:{HttpServer})

Listen to `request` event of the vanilla node.js `HttpServer` instance.
