var genji = require('genji');
var App = genji.App;

var HelloWorldApp = App('HelloWorld', {
  hello:function (name) {
    var self = this;
    setTimeout(function () {
      self.emit('hello', null, 'Hello, ' + name);
    }, 300);
  },

  thanks:function () {
    this.emit('thanks');
  },

  routes: {
    hello: {method: 'get', url:'^/hello/(.*)'},
    thanks: {method: 'get', url: '/thanks'},
    notfound: {method: 'notfound', url: '^/*', handleFunction:function (handler) {
      handler.error(404, 'Content not found');
    }}
  },

  routeResults: {
    hello:function (err, text) {
      var thanksLink = '<br /><a href="/helloworld/thanks">go thanks</a>';
      this.handler.sendHTML(text + thanksLink);
    },
    notfound:function () {
      this.handler.error(404, 'Content not found')
    }
  }
});

var helloWorld = new HelloWorldApp();
// normal result event listener
helloWorld.onResult('hello', function (err, text) {
  console.log(text);
});

// route result event listener
helloWorld.onRouteResult('thanks', function (err) {
  this.handler.send('Thank you!');
});

genji.loadApp(helloWorld);

// create a http server
var server = genji.createServer();

// start handling request
server.listen(8888, '127.0.0.1');

// now open up http://127.0.0.1:8888/hello/john in your browser