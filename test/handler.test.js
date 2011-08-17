var genji = require('genji');
var Handler = genji.require('handler').Handler;
var assert = require('assert');
var timeout = 500;

exports['test header operations 1'] = function() {
  var app = genji.app();
  var data = 'get: Hello world!';
  var appRoute = app.get('^/header1$');
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
  appRoute.handler(Handler);
  assert.response(genji.createServer(), {
        url: '/header1',
        timeout: timeout,
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
  var appRoute = app.get('^/header2$');
  appRoute.fn(function(handler) {
    handler.addHeader('key1', 'value1');
    handler.addHeader('key2', 'value2');
    handler.sendHeaders(201, {'key3': 'value3'});
    handler.finish(data);
  });
  appRoute.handler(Handler);
  assert.response(genji.createServer(), {
        url: '/header2',
        timeout: timeout,
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
  var appRoute = app.get('^/error$');
  appRoute.fn(function(handler) {
    handler.addHeader('key1', 'value1');
    handler.setHeader('key2', 'value2');
    handler.error(502, 'error 502');
  });
  appRoute.handler(Handler);
  assert.response(genji.createServer(), {
        url: '/error',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, 'error 502');
        assert.equal(res.statusCode, 502);
        assert.isUndefined(res.headers.key1);
        assert.isUndefined(res.headers.key2);
      });

  app.get('^/301$', function(handler) {
    handler.addHeader('key1', 'value1');
    handler.setHeader('key2', 'value2');
    handler.redirect('/to301', true);
  }, Handler);
  assert.response(genji.createServer(), {
        url: '/301',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, '');
        assert.equal(res.statusCode, 301);
        assert.equal(res.headers.location, '/to301');
        assert.isUndefined(res.headers.key1);
        assert.isUndefined(res.headers.key2);
      });

  app.get('^/302$', function(handler) {
    handler.addHeader('key1', 'value1');
    handler.setHeader('key2', 'value2');
    handler.redirect('/to302', false);
  }, Handler);
  assert.response(genji.createServer(), {
        url: '/302',
        timeout: timeout,
        method: 'GET'
      }, function(res) {
        assert.equal(res.body, '');
        assert.equal(res.statusCode, 302);
        assert.equal(res.headers.location, '/to302');
        assert.isUndefined(res.headers.key1);
        assert.isUndefined(res.headers.key2);
      });
};

exports['test send, sendJSON, sendHTML'] = function() {
  var app = genji.app();

  app.get('^/testsend$').fn(function(handler) {
    handler.send('body', 200, {key1: 'headerValue'}, 'utf8');
  });
  assert.response(genji.createServer(), {
    url: '/testsend',
    timeout: timeout,
    method: 'GET'
  }, function(res) {
    assert.equal(res.body, 'body');
    assert.equal(res.statusCode, 200);
    assert.eql(res.headers.key1, 'headerValue');
  });

  app.get('^/testsendJSON$').fn(function(handler) {
    handler.setHeader('key2', 'json');
    handler.sendJSON({data: "body"});
  });
  assert.response(genji.createServer(), {
    url: '/testsendJSON',
    timeout: timeout,
    method: 'GET'
  }, function(res) {
    var json = JSON.parse(res.body);
    assert.equal(json.data, 'body');
    assert.equal(res.statusCode, 200);
    assert.eql(res.headers.key2, 'json');
    assert.eql(res.headers['content-type'], 'application/json; charset=utf-8');
  });

  app.get('^/testsendHTML$').fn(function(handler) {
    handler.setHeader('key2', 'html');
    handler.sendHTML('<html></html>');
  });
  assert.response(genji.createServer(), {
    url: '/testsendHTML',
    timeout: timeout,
    method: 'GET'
  }, function(res) {
    assert.equal(res.body, '<html></html>');
    assert.equal(res.statusCode, 200);
    assert.eql(res.headers.key2, 'html');
    assert.eql(res.headers['content-type'], 'text/html; charset=utf-8');
  });

  var jsonStr = JSON.stringify({key: "value"});
  app.post('^/receiveJSON$').fn(function(handler) {
    handler.on('json', function(json, data, error) {
      if (!error) {
        assert.eql(json.key, 'value');
        assert.eql(data, jsonStr);
        handler.sendJSON({ok: true});
      }
    });
  });
  assert.response(genji.createServer(), {
    url: '/receiveJSON',
    timeout: timeout,
    data: jsonStr,
    method: 'POST'
  }, function(res) {
    var json = JSON.parse(res.body);
    assert.eql(json.ok, true);
    assert.eql(res.statusCode, 200);
    assert.eql(res.headers['content-type'], 'application/json; charset=utf-8');
  });
};

exports['test cookie'] = function() {
  var Cookie = genji.require('cookie');
  var app = genji.app();
  var cookieOptions = {
    expires: new Date(10000),
    path: '/cookie',
    domain: 'test.com',
    secure: true,
    httponly: true
  };
  app.get('^/cookie$').fn(function(handler) {
    var clientCookieValue = handler.getCookie('client_cookie');
    assert.eql(clientCookieValue, 'client_value');
    assert.eql(Cookie.checkLength(handler.headers.cookie), true);
    handler.setCookie('test_cookie', 'cookie_value', cookieOptions);
    handler.clearCookie('cookie_to_clear', {path: '/'});
    handler.sendHTML('<br />');
  });
  var clientCookie = 'client_cookie=client_value;';
  assert.response(genji.createServer(), {
    url: '/cookie',
    timeout: timeout,
    headers: {'Cookie': clientCookie},
    method: 'GET'
  }, function(res) {
    var cookieValue = Cookie.parse(res.headers['set-cookie'][0], 'test_cookie');
    var cookies = [
      'test_cookie=cookie_value; expires=Thu, 01 Jan 1970 00:00:10 GMT; path=/cookie; domain=test.com; secure=true; httponly=true',
      "cookie_to_clear=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"
    ];
    assert.eql(cookieValue, 'cookie_value');
    assert.eql(res.headers['set-cookie'], cookies);
    assert.eql(res.statusCode, 200);
    assert.eql(res.body, '<br />');
    assert.eql(res.headers['content-type'], 'text/html; charset=utf-8');
  });
};

exports['test sending file or file like content'] = function() {
  var app = genji.app();
  var crypto = genji.require('crypto');

  app.get('^/testStaticFile.js$').fn(function(handler) {
    handler.staticFile(__filename);
  });
  assert.response(genji.createServer(), {
    url: '/testStaticFile.js',
    timeout: timeout,
    method: 'get'
  }, function(res) {
    crypto.md5file(__filename, 'hex', function(err, hash) {
      assert.eql(err, null);
      assert.eql(crypto.md5(res.body, 'hex'), hash);
    });
    assert.eql(res.statusCode, 200);
    assert.eql(res.headers['content-type'], 'application/javascript');
  });

  var fs = require('fs');
  app.get('^/testSendAsFile.js$').fn(function(handler) {
    fs.readFile(__filename, 'utf8', function(err, data) {
      if (!err) {
        handler.sendAsFile(data, {ext: '.js'});
      }
    });
  });
  assert.response(genji.createServer(), {
    url: '/testSendAsFile.js',
    timeout: timeout,
    method: 'get'
  }, function(res) {
    crypto.md5file(__filename, 'hex', function(err, hash) {
      assert.eql(err, null);
      assert.eql(crypto.md5(res.body, 'hex'), hash);
    });
    assert.eql(res.statusCode, 200);
    assert.eql(res.headers['content-type'], 'application/javascript');
  });
};