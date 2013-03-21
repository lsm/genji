/**
 * Example of using "Site" and "App"
 */

/**
 * Module dependencies
 */

var genji = require('.');
var App = genji.App;

// Define an app
var GreetingApp = App({

  name: 'Greeting',

  hello: function (name, callback) {
    callback(null, 'Hello, ' + name);
  }
});

var ClockApp = App({

  name: 'Clock',

  getDate: function (callback) {
    callback(null, new Date);
  },

  getUTCFullYear: function (callback) {
    callback(null, (new Date).getUTCFullYear());
  }
});

// Define a customized routes
var routes = {
  greeting: {urlRoot: '^/app'},
  greetingHello: {url: '/hello/(.*)'}
};

// Create site instance
var site = genji.site();

// Load the apps into site with routes
site.load(GreetingApp, routes);
site.load(ClockApp);

// Map and alter route after app loaded
site.map({
  clockGetUTCFullYear: {url: '^/year$', method: 'post'}
});

// Start handling request
site.start();

// try on console:
// curl http://127.0.0.1:8888/app/hello/john
// curl http://127.0.0.1:8888/clock/get/date
// curl -X POST http://127.0.0.1:8888/year