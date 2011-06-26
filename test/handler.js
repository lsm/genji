var genji = require('genji');
var Handler = genji.require('handler');
var assert = require('assert');

exports['test header operations 1'] = function() {
  var app = genji.app();
  var data = 'get: Hello world!';
  var appRoute = app.get('/header1');
  appRoute.fn(function(handler) {
    handler.addHeader('key1', 'value1');
    handler.setHeader('key2', 'value2');
    handler.addHeader('key2', 'value3');
    handler.addHeader('key3', 'value3');
    assert.equal(handler.getHeader('key3'), 'value3');
    handler.removeHeader('key3', 'value3');
    assert.isUndefined(handler.getHeader('key3'));
    handler.setStatus(202);
    handler.finish(data);
  });
  appRoute.handler(Handler.Handler);
  assert.response(genji.createServer(), {
        url: '/header1',
        timeout: 100,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, data);
        assert.equal(res.statusCode, 202);
        assert.equal(res.headers.key1, 'value1');
        assert.equal(res.headers.key2, 'value2');
        assert.isUndefined(res.headers.key3);
      });
};

exports['test header operations 2'] = function() {
  var app = genji.app();
  var data = 'get: Hello world!';
  var appRoute = app.get('/header2');
  appRoute.fn(function(handler) {
    handler.addHeader('key1', 'value1');
    handler.addHeader('key2', 'value2');
    handler.sendHeaders(201, {'key3': 'value3'});
    handler.finish(data);
  });
  appRoute.handler(Handler.Handler);
  assert.response(genji.createServer(), {
        url: '/header2',
        timeout: 100,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, data);
        assert.equal(res.statusCode, 201);
        assert.equal(res.headers.key3, 'value3');
        assert.isUndefined(res.headers.key1);
        assert.isUndefined(res.headers.key2);
      });
};

exports['test error and redirect'] = function() {
  var app = genji.app();
  var appRoute = app.get('/error');
  appRoute.fn(function(handler) {
    handler.addHeader('key1', 'value1');
    handler.setHeader('key2', 'value2');
    handler.error(502, 'error 502');
  });
  appRoute.handler(Handler.Handler);
  assert.response(genji.createServer(), {
        url: '/error',
        timeout: 100,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, 'error 502');
        assert.equal(res.statusCode, 502);
        assert.isUndefined(res.headers.key1);
        assert.isUndefined(res.headers.key2);
      });

  app.get('/301', function(handler) {
    handler.addHeader('key1', 'value1');
    handler.setHeader('key2', 'value2');
    handler.redirect('/to301', true);
  }, Handler.Handler);
  assert.response(genji.createServer(), {
        url: '/301',
        timeout: 100,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, '');
        assert.equal(res.statusCode, 301);
        assert.equal(res.headers.location, '/to301');
        assert.isUndefined(res.headers.key1);
        assert.isUndefined(res.headers.key2);
      });

  app.get('/302', function(handler) {
    handler.addHeader('key1', 'value1');
    handler.setHeader('key2', 'value2');
    handler.redirect('/to302', false);
  }, Handler.Handler);
  assert.response(genji.createServer(), {
        url: '/302',
        timeout: 100,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, '');
        assert.equal(res.statusCode, 302);
        assert.equal(res.headers.location, '/to302');
        assert.isUndefined(res.headers.key1);
        assert.isUndefined(res.headers.key2);
      });
};