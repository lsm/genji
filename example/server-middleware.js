/**
 * Example for using a simple Genji middleware plugin
 */

var genji = require('../lib/genji');

// Create a Site instance
var site = genji.site();

// Use the "helloworld" plugin
site.use(require('./plugin-helloworld'));

// handle "helloworld" event emits from the plugin
site.on('helloworld', function () {
  console.log('Got helloworld request');
});

// start a http server
site.start();

// now
// open http://127.0.0.1:8888/