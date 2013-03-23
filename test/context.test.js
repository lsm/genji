var genji = require('../index');
var http = require('http');
var Context = genji.Context;
var assert = require('assert');
var timeout = 500;

exports['test header operations 1'] = function () {
  var router = genji.route();
  var data = 'get: Hello world!';
  router.get('^/header1$', function (context) {
    context.addHeader('key1', 'value1');
    context.setHeader('key2', 'value2');
    context.addHeader('key2', 'value3');
    context.addHeader('key3', 'value3');
    assert.equal(context.getHeader('key3'), 'value3');
    context.removeHeader('key3', 'value3');
    assert.isUndefined(context.getHeader('key3'));
    context.setStatusCode(202);
    context.end(data);
  });

  var server = http.createServer();
  router.listen(server, Context);

  assert.response(server, {
    url: '/header1',
    timeout: timeout,
    method: 'GET'
  }, function (res) {
    assert.equal(res.body, data);
    assert.equal(res.statusCode, 202);
    assert.equal(res.headers.key1, 'value1');
    assert.equal(res.headers.key2, 'value2');
    assert.isUndefined(res.headers.key3);
  });
};

exports['test error and redirect'] = function () {
  var router = genji.route();
  router.get('^/error$', function (context) {
    context.addHeader('key1', 'value1');
    context.setHeader('key2', 'value2');
    context.error({statusCode: 502, message: 'error 502'});
  });

  var server = http.createServer();
  router.listen(server, Context);

  assert.response(server, {
    url: '/error',
    timeout: timeout,
    method: 'GET'
  }, function (res) {
    assert.equal(res.body, 'error 502');
    assert.equal(res.statusCode, 502);
    assert.eql('value1', res.headers.key1);
    assert.eql('value2', res.headers.key2);
  });

  router.get('^/301$', function (context) {
    context.addHeader('key1', 'value1');
    context.setHeader('key2', 'value2');
    context.redirect('/to301', true);
  });

  router.build();

  assert.response(server, {
    url: '/301',
    timeout: timeout,
    method: 'GET'
  }, function (res) {
    assert.equal(res.body, '');
    assert.equal(res.statusCode, 301);
    assert.equal(res.headers.location, '/to301');
    assert.equal(res.headers.key1, 'value1');
    assert.equal(res.headers.key2, 'value2');
  });

  router.get('^/302$', function (context) {
    context.addHeader('key1', 'value1');
    context.setHeader('key2', 'value2');
    context.redirect('/to302', false);
  });

  router.build();

  assert.response(server, {
    url: '/302',
    timeout: timeout,
    method: 'GET'
  }, function (res) {
    assert.equal(res.body, '');
    assert.equal(res.statusCode, 302);
    assert.equal(res.headers.location, '/to302');
    assert.equal(res.headers.key1, 'value1');
    assert.equal(res.headers.key2, 'value2');
  });
};

exports['test send, sendJSON, sendHTML'] = function () {
  var router = genji.route();
  var ParserContext = Context(require('../lib/plugin/parser').module);

  router.get('^/testsend$', function (context) {
    context.send('body', 200, {key1: 'headerValue'}, 'utf8');
  });

  var server = http.createServer();
  router.listen(server, ParserContext);

  assert.response(server, {
    url: '/testsend',
    timeout: timeout,
    method: 'GET'
  }, function (res) {
    assert.equal(res.body, 'body');
    assert.equal(res.statusCode, 200);
    assert.eql(res.headers.key1, 'headerValue');
  });

  router.get('^/testsendJSON$', function (context) {
    context.setHeader('key2', 'json');
    context.sendJSON({data: "body"});
  }).build();

  assert.response(server, {
    url: '/testsendJSON',
    timeout: timeout,
    method: 'GET'
  }, function (res) {
    var json = JSON.parse(res.body);
    assert.equal(json.data, 'body');
    assert.equal(res.statusCode, 200);
    assert.eql(res.headers.key2, 'json');
    assert.eql(res.headers['content-type'], 'application/json; charset=utf-8');
  });

  router.get('^/testsendHTML$', function (context) {
    context.setHeader('key2', 'html');
    context.sendHTML('<html></html>');
  }).build();

  assert.response(server, {
    url: '/testsendHTML',
    timeout: timeout,
    method: 'GET'
  }, function (res) {
    assert.equal(res.body, '<html></html>');
    assert.equal(res.statusCode, 200);
    assert.eql(res.headers.key2, 'html');
    assert.eql(res.headers['content-type'], 'text/html; charset=utf-8');
  });
};

exports['test cookie plugin'] = function () {
  var Cookie = genji.cookie;
  var CookieContext = Context(require('../lib/plugin/cookie').module);
  var cookieOptions = {
    expires: new Date(10000),
    path: '/cookie',
    domain: 'test.com',
    secure: true,
    httponly: true
  };

  var router = genji.route({contextClass: CookieContext});

  router.get('^/cookie$', function (context) {
    var clientCookieValue = context.getCookie('client_cookie');
    assert.eql(clientCookieValue, 'client_value');
    assert.eql(Cookie.checkLength(context.request.headers.cookie), true);
    context.setCookie('test_cookie', 'cookie_value', cookieOptions);
    context.clearCookie('cookie_to_clear', {path: '/'});
    context.sendHTML('<br />');
  });

  var server = http.createServer();
  router.listen(server);

  var clientCookie = 'client_cookie=client_value;';
  assert.response(server, {
    url: '/cookie',
    timeout: timeout,
    headers: {'Cookie': clientCookie},
    method: 'GET'
  }, function (res) {
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

exports['test file plugin'] = function () {
  var router = genji.route();
  var crypto = genji.crypto;
  var fs = require('fs');

  var FileContext = Context(require('../lib/plugin/file').module);

  router.get('^/testStaticFile.js$', function (context) {
    context.staticFile(__filename);
  });

  var server = http.createServer();
  router.listen(server, FileContext);

  assert.response(server, {
    url: '/testStaticFile.js',
    timeout: timeout,
    method: 'get'
  }, function (res) {
    crypto.md5file(__filename, 'hex', function (err, hash) {
      assert.eql(err, null);
      assert.eql(crypto.md5(res.body, 'hex'), hash);
    });
    assert.eql(res.statusCode, 200);
    assert.eql(res.headers['content-type'], 'application/javascript');
  });

  router.get('^/testSendAsFile.js$', function (context) {
    fs.readFile(__filename, 'utf8', function (err, data) {
      if (!err) {
        context.sendAsFile(data, {ext: '.js'});
      }
    });
  }).build();

  assert.response(server, {
    url: '/testSendAsFile.js',
    timeout: timeout,
    method: 'get'
  }, function (res) {
    crypto.md5file(__filename, 'hex', function (err, hash) {
      assert.eql(err, null);
      assert.eql(crypto.md5(res.body, 'hex'), hash);
    });
    assert.eql(res.statusCode, 200);
    assert.eql(res.headers['content-type'], 'application/javascript');
  });
};