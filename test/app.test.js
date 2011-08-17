var genji = require('genji');
var assert = require('assert');
var timeout = 500;

exports['test app#get'] = function() {
  var app = genji.app();
  var data = 'get: Hello world!';
  app.get('helloworld$').fn(function(handler) {
    handler.send(data);
  });
  assert.response(genji.createServer(), {
        url: '/helloworld',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, data);
      });

  genji.app('foo').get('$', function(handler) {
    handler.send('is at /foo ');
  });
    assert.response(genji.createServer(), {
        url: '/foo',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, 'is at /foo ');
      });
  
  genji.app('foo').get('/$', function(handler) {
    handler.send('is at /foo/ ');
  });
    assert.response(genji.createServer(), {
        url: '/foo/',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, 'is at /foo/ ');
      });

  genji.app('bar').get('/$', function(handler) {
    handler.send('is at /bar/ ');
  });
    assert.response(genji.createServer(), {
        url: '/bar/',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, 'is at /bar/ ');
      });
};

exports['test app#post'] = function() {
  var app = genji.app('namedApp');
  var data = 'post: Hello world!';
  app.post('/helloworld$', function(handler) {
    handler.on('params', function(params, raw) {
      if (params.x === 'a' && params.y === 'b' && raw === 'x=a&y=b') {
        handler.send(data, 201, {Server: 'GenJi'});
      } else {
        handler.setStatus(500).finish('error');
      }
    });
  });
  assert.response(genji.createServer(), {
        url: '/namedApp/helloworld',
        timeout: timeout,
        method: 'POST',
        data: 'x=a&y=b'
      }, function(res) {
        assert.equal(res.body, data);
        assert.equal(res.statusCode, 201);
        assert.equal(res.headers.server, 'GenJi');
      });
  
  app.post('helloworld$', function(handler) {
    handler.on('data', function(params, raw) {
      if (params.x === 'a' && params.y === 'b' && raw === 'x=a&y=b') {
        handler.send(data, 201, {Server: 'GenJi'});
      } else {
        handler.setStatus(500).finish('error');
      }
    });
  });
  assert.response(genji.createServer(), {
        url: '/namedApphelloworld',
        timeout: timeout,
        method: 'POST',
        data: 'x=c&y=d'
      }, function(res) {
        assert.equal(res.body, 'error');
        assert.equal(res.statusCode, 500);
      });

  app.post('^/fullurlpattern$', function(handler) {
    handler.on('params', function(params, raw) {
      if (params.x === 'a' && params.y === 'b' && raw === 'x=a&y=b') {
        handler.send(data, 201, {Server: 'GenJi'});
      } else {
        handler.setStatus(500).finish('error');
      }
    });
  });
  assert.response(genji.createServer(), {
        url: '/fullurlpattern',
        timeout: timeout,
        method: 'POST',
        data: 'x=a&y=b'
      }, function(res) {
        assert.equal(res.body, data);
        assert.equal(res.statusCode, 201);
        assert.equal(res.headers.server, 'GenJi');
      });
};

exports['test app#put'] = function() {
  var app = genji.app('a put app', {root: '/put'});
  var data = 'put: Hello world!';
  app.put('/helloworld$', function(handler) {
    handler.send(data);
  });
  assert.response(genji.createServer(), {
        url: '/put/helloworld',
        timeout: timeout,
        method: 'PUT'
      }, function(res) {
        assert.equal(res.body, data);
      });
};

exports['test app#del'] = function() {
  var app = genji.app();
  var data = 'del: Hello world!';
  app.del('/helloworld$', function(handler) {
    handler.send(data);
  });
  assert.response(genji.createServer(), {
        url: '/helloworld',
        timeout: timeout,
        method: 'DELETE'
      }, function(res) {
        assert.equal(res.body, data);
      });
};

exports['test app#head'] = function() {
  var app = genji.app();
  app.head('/helloworld$', function(handler) {
    handler.setStatus(304);
    handler.finish();
  });
  assert.response(genji.createServer(), {
        url: '/helloworld',
        timeout: timeout,
        method: 'HEAD'
      }, function(res) {
        assert.equal(res.statusCode, 304);
      });
};

exports['test app#notFound'] = function() {
  var app = genji.app();
  app.notFound('/*', function(handler) {
    handler.error(404, 'not found: ' + this.request.url);
  });
  assert.response(genji.createServer(), {
        url: '/noexistenturl',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.statusCode, 404);
        assert.equal(res.body, 'not found: /noexistenturl');
      });
};

exports['test app#mount'] = function() {
  var app = genji.app();
  var data = 'mount+get: Hello world!';
  var method = 'get';
  function fn(handler) {
    handler.send(data);
  };
  app.mount([
    ['^/mount/helloworld$', fn, method]
  ]);
  assert.response(genji.createServer(), {
        url: '/mount/helloworld',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, data);
      });
};