var genji = require('../index');
var http = require('http');
var Context = genji.Context;
var assert = require('assert');
var request = require('supertest');

describe('Context', function () {
  var router;
  var server;

  beforeEach(function () {
    router = genji.route();
    server = http.createServer();
  });

  describe('.setHeader', function () {
    it('should override header added by addHeader', function (done) {
      var data = 'get: Hello world!';
      router.get('^/header1$', function (context) {
        context.addHeader('key1', 'value1');
        context.setHeader('key2', 'value2');
        context.addHeader('key2', 'value3');
        context.addHeader('key3', 'value3');
        assert.equal(context.getHeader('key3'), 'value3');
        context.removeHeader('key3', 'value3');
        assert.equal(undefined, context.getHeader('key3'));
        context.setStatusCode(202);
        context.end(data);
      });

      router.listen(server, Context);

      request(server)
        .get('/header1')
        .expect('key1', 'value1')
        .expect('key2', 'value2')
        .expect(202, data)
        .end(function (err, res) {
          assert.equal(res.headers.key3, undefined);
          done();
        });
    });
  });

  describe('.error(errObj)', function () {
    it('should response status code and message supplied', function (done) {
      router.get('^/error$', function (context) {
        context.addHeader('key1', 'value1');
        context.setHeader('key2', 'value2');
        context.error({statusCode: 502, message: 'error 502'});
      });

      router.listen(server, Context);

      request(server)
        .get('/error')
        .expect('key1', 'value1')
        .expect('key2', 'value2')
        .expect(502, 'error 502', done);
    });
  });

  describe('.redirect(url[, permanent])', function () {
    it('should redirect with status code 301', function (done) {
      router.get('^/301$', function (context) {
        context.addHeader('key1', 'value1');
        context.setHeader('key2', 'value2');
        context.redirect('/to301', true);
      });

      router.listen(server, Context);

      request(server)
        .get('/301')
        .expect('key1', 'value1')
        .expect('key2', 'value2')
        .expect('location', '/to301')
        .expect(301, '', done);
    });

    it('should redirect with status code 302', function (done) {
      router.get('^/302$', function (context) {
        context.addHeader('key1', 'value1');
        context.setHeader('key2', 'value2');
        context.redirect('/to302', false);
      });

      router.listen(server, Context);

      request(server)
        .get('/302')
        .expect('key1', 'value1')
        .expect('key2', 'value2')
        .expect('location', '/to302')
        .expect(302, '', done);
    });
  });

  describe('.send', function () {
    it('should send body with status code and headers', function (done) {
      router.get('^/test/send$', function (context) {
        context.send('body', 201, {key1: 'headerValue'}, 'utf8');
      });

      router.listen(server, Context);

      request(server)
        .get('/test/send')
        .expect('key1', 'headerValue')
        .expect(201, 'body', done);
    });
  });

  describe('.sendJSON', function () {
    it('should send data object as json', function (done) {
      router.get('^/test/sendJSON$', function (context) {
        context.setHeader('key2', 'json');
        context.sendJSON({data: "body"});
      });

      router.listen(server, Context);

      request(server)
        .get('/test/sendJSON')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect('key2', 'json')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          assert.equal('body', res.body.data);
          done();
        });
    });
  });

  describe('.sendHTML', function () {
    it('should send data string as html text', function (done) {
      var html = '<html>test html</html>';
      router.get('^/test/sendHTML$', function (context) {
        context.setHeader('key2', 'html');
        context.sendHTML(html);
      });

      router.listen(server, Context);

      request(server)
        .get('/test/sendHTML')
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect('key2', 'html')
        .expect(200, html, done);
    });
  });

  it('should be able to set/parse cookie by using cookie plugin', function (done) {
    var Cookie = genji.cookie;
    var CookieContext = Context(genji.plugin.cookie.module);
    var cookieOptions = {
      expires: new Date(10000),
      path: '/cookie',
      domain: 'test.com',
      secure: true,
      httponly: true
    };
    var clientCookie = 'client_cookie=client_value;';
    var cookies = [
      'test_cookie=cookie_value; expires=Thu, 01 Jan 1970 00:00:10 GMT; path=/cookie; domain=test.com; secure=true; httponly=true',
      "cookie_to_clear=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"
    ];

    var router = genji.route({contextClass: CookieContext});

    router.get('^/cookie$', function (context) {
      var clientCookieValue = context.getCookie('client_cookie');
      assert.equal(clientCookieValue, 'client_value');
      assert.equal(Cookie.checkLength(context.request.headers.cookie), true);
      context.setCookie('test_cookie', 'cookie_value', cookieOptions);
      context.clearCookie('cookie_to_clear', {path: '/'});
      context.sendHTML('<br />');
    });

    router.listen(server);

    request(server)
      .get('/cookie')
      .set('Cookie', clientCookie)
      .expect(200, '<br />')
      .expect('content-type', 'text/html; charset=utf-8')
      .end(function (err, res) {
        var cookieValue = Cookie.parse(res.headers['set-cookie'][0], 'test_cookie');
        assert.equal('cookie_value', cookieValue);
        assert.equal(cookies[0], res.headers['set-cookie'][0]);
        assert.equal(cookies[1], res.headers['set-cookie'][1]);
        done();
      });
  });
});