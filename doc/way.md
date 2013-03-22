The way to Genji
===========

The simplest way to use Genji is to use it as a url based http request router

```javascript
var genji = require('genji');
var http = require('http');

// create a router instance
var simpleRouter = genji.route();

// routing request to function by matching url
simpleRouter.get('^/$', function(context) {
  context.send('Hello world!');
});

// create a http server object
var server = http.createServer();

// listen to request event
simpleRouter.listen(server);

// start handling request
server.listen(8888, '127.0.0.1');
```

This is regular request routing functionnality which you can find in a lots of frameworks of any language. Of course,
this is not what all Genji can do. If you feel the above example already meets most of your needs, then go to
[Router](router.html) to see detailed usages. And also go [Context](core.html#context) check out what it is and see how you
can use and extend it. If it's not, and you feel this is too primitive. You have another option called [Site](site.html)
which is more suitable for large/complex project. So you can change the way of using Genji during evolvement of your
project and Genji helps you grow smoothly during that process.