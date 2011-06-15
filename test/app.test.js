var genji = require('genji');
var assert = require('assert');

exports['test app#get'] = function() {
  var app = genji.app();
  var data = 'Hello world!';
  app.get('/helloworld', function(handler) {
    handler.send(data);
  });
  assert.response(genji.createServer(), {
        url: '/helloworld',
        timeout: 100,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, data);
      });
};

exports['test app#post'] = function() {
  var app = genji.app();
  var data = 'Hello world!';
  app.post('/helloworld', function(handler) {
    handler.on('data', function(params, raw) {
      if (params.x === 'a' && params.y === 'b' && raw === 'x=a&y=b') {
        handler.send(data, 201, {Server: 'GenJi'});
      } else {
        handler.finish('error');
      }
    });
  });
  assert.response(genji.createServer(), {
        url: '/helloworld',
        timeout: 100,
        method: 'POST',
        data: 'x=a&y=b'
      }, function(res) {
        assert.equal(res.body, data);
        assert.equal(res.statusCode, 201);
        assert.equal(res.headers.server, 'GenJi');
      });
};

exports['test app#put'] = function() {
  var app = genji.app();
  var data = 'Hello world!';
  app.put('/helloworld', function(handler) {
    handler.send(data);
  });
  assert.response(genji.createServer(), {
        url: '/helloworld',
        timeout: 100,
        method: 'PUT'
      }, function(res) {
        assert.equal(res.body, data);
      });
};

exports['test app#del'] = function() {
  var app = genji.app();
  var data = 'Hello world!';
  app.del('/helloworld', function(handler) {
    handler.send(data);
  });
  assert.response(genji.createServer(), {
        url: '/helloworld',
        timeout: 100,
        method: 'DELETE'
      }, function(res) {
        assert.equal(res.body, data);
      });
};

exports['test app#head'] = function() {
  var app = genji.app();
  app.head('/helloworld', function(handler) {
    handler.setStatus(304);
    handler.finish();
  });
  assert.response(genji.createServer(), {
        url: '/helloworld',
        timeout: 100,
        method: 'HEAD'
      }, function(res) {
        assert.equal(res.statusCode, 304);
      });
};