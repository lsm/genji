var genji = require('genji');
var assert = require('assert');
var Client = genji.require('client').Client;

exports['test client#get/post'] = function() {
  var app = genji.app();
  var data = 'Hello world!';
  app.get('^/helloworld/').fn(function(handler) {
    var params = handler.params;
    assert.eql(params.a, '1');
    assert.eql(params.b, '2');
    handler.send(data);
  });

  app.post('^/hellopost$').fn(function(handler) {
    handler.on('params', function(params) {
      assert.eql(params.a, '1');
      assert.eql(params.b, '2');
      handler.send(data);
    });
  });

  app.put('^/putjson').fn(function(handler) {
    assert.eql(handler.params.q, 'query');
    handler.on('json', function(json) {
      assert.eql(json.a, 1);
      assert.eql(json.b, 2);
      handler.send(data);
    });
  });

  var server = genji.createServer();
  server.listen(8000, '127.0.0.1');

  var count = 0;

  function close() {
    if (++count === 3) {
      server.close();
    }
  }

  var client = new Client('http://127.0.0.1:8000/');

  client.get('/helloworld/', {a: 1, b: 2}).then(function(data) {
    assert.equal(data.toString(), data);
    close();
  });
  client.post('/hellopost', {a: 1, b: 2}).then(function(data) {
    assert.equal(data.toString(), data);
    close();
  });
  client
    .put('/putjson?q=query', {a: 1, b: 2}, {'Content-Type': 'application/json'})
    .then(function(data) {
      assert.equal(data.toString(), data);
      close();
    });
};