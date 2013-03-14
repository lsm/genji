Router
======

Router routes http request to designated handling function based on the requesting url. It supports calling hook
function before/after dispatch to handling function. Router can be used standalone which means no site/middleware/app involved.

## Usage

### Add route definition

```javascript
  var genji = require('genji');

  var router = genji.route({urlRoot: '/home'});

  // handle GET request for url '/home/hello?title=Mr' (urlRoot + url)
  router.get('/hello/(.*)', function(handler, name) {
    handler.sendHTML('Hello, ' + handler.query.title + ' ' + name);
  });

  // 'urlRoot` will not be prefixed before your url if it starts with '^'
  router.post('^/post', function(handler) {
    // post parameters will be parsed if handler listen to the 'params' event.
    handler.on('params', function(params) {
      // do something
      handler.send('ok');
    });
  });
```

### Hooks

You can use `Hooks` to do some tasks before and after dispatch. Hook functions together with handle function will be chained
into an array by router. And all functions in chain will be called in order during dispatch. During the dispatching process,
you must explicitly call `next` or return `true` in hook function to call the next function in chain.

We use `null` to mark the position of the dispatch function. During dispatch, the `null` placeholder will be replaced by
handle function. Some special cases when:
  - `null` is at beginning of the array, all functions are post hook (e.g. [null, fn1, fn2])
  - `null` is not presented or at the end of array, all functions are pre hook (e.g. [fn1, fn2] === [fn1, fn2, null])
  - the hook is a function, it means the function is a pre hook (e.g. fn1 === [fn1])

```javascript

  function preHook(handler, next) {
    // you can call `next` asynchronously, the next function in chain won't be called
    // until you call `next`
    setTimeout(next, 1000);
  }

  function postHook(handler, next) {
    // if you return true, the next function in chain (if any) will be called immediately
    return true;
  }

  router.get('/hooked', function() {}, [preHook, null, postHook]);

```

### Listen to server event

You can use router directly with HttpServer instance.

```javascript

  // listen to 'request' event of HttpServer instance
  router.listen(server);

```

If you have more complex project, please use [Site](#site) with [App](#app).

## API

`Router` exposed by `require('genji').Router`. Instance can be created by

```javascript

    var router = require('genji').route(options);

```

### genji.route(options:Object)

Takes **optional** options and create a new `genji.Router` instance.

Supported options:

 - `urlRoot` is the base url of the router, default value is '^/'.
 - `handlerClass` the default handler class for each request. See [Handler](#handler) for more info.

### Methods

#### Router#{get|post|put|delete|head}(url:{String|RegExp}, handleFunction:Function, /\*optional\*/ options:Object)

The `get/post/put/delete/head` route defining methods of `Router` instance have the same signature:

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
    - `hooks` a function or array of functions which will be called before dispatch to handling function

The `options` has following transformations:
  - *Function* which means `options` is `handlerClass`
  - *Array* which means `options` is `hooks`

Routing rules are grouped by http method. Previous rule could be overriden by subsequently calling routing method with same
http method and url. That means you can have different handling functions for the same url with different http method.

#### Router#mount(urls:{Array})

Add batch of routing rules at once. Each element in the `urls` array should be an array with members of following order:

  - `url` same as described above in `get/post/put/delete/head` methods
  - `handleFunction` same as described above
  - `httpMethod` *Optional* http method that accepted, default to 'GET'
  - `options` *Optional* same as described above

#### Router#notFound(url:{String|RegExp}, handleFunction:Function)

The miss matched matcher. You can use it to handle miss matched requests based on different url.

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
  - `notFound` is an optional function which will be called when no rule matched the given input

#### Router#{hook}(fn:{Function|Array})

Add pre/post hook(s) to all existent url routing rules in the current router instance. Takes one argument which could be
function (pre hook) or array of `null positioned` hooking functions. This method adds pre hook to the `left` side (begin)
of existent pre hooks and adds post hook to `right` side (end) of existent post hooks.

#### Router#listen(server:{HttpServer}, /\*optional\*/ notFound:Function)

Listen to `request` event of the vanilla node.js `HttpServer` instance.

  - `server` is an instance of HttpServer
  - `notFound` is an optional function which will be called when all routes miss matched in the router.
    A default function that responds 404 to client and output error to `stderr` will be called if you omit the function
