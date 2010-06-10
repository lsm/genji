require.paths.unshift('./jasmine-node/lib/', '../lib');
var jasmine = require('jasmine');

// this is needed for asyncSpecWait
for(var key in jasmine) {
  global[key] = jasmine[key];
}

jasmine.run(__dirname);