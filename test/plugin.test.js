var genji = require('../index');
var http = require('http');
var assert = require('assert');
var request = require('supertest');
var querystring = require('querystring');
var Router = genji.Router;

describe('Plugin', function () {
  var core;
  var server;
  beforeEach(function () {
    core = new genji.Core();
    server = http.createServer();
  });

  describe('.parser', function () {
    it('should parse json request', function (done) {
      core.loadPlugin('parser');
      core.loadPlugin('router', {urlRoot: '^/json'});

      var jsonStr = JSON.stringify({key: "value"});

      var routes = {
        receiveJSON: {
          url: '/receive$',
          method: 'POST',
          handler: function (context) {
            var json = context.json;
            assert.equal(json.key, 'value');
            assert.equal(context.data, jsonStr);
            context.sendJSON({ok: true});
          }
        }
      };

      core.mapRoutes(routes);
      server.on('request', core.getListener());

      request(server)
        .post('/json/receive')
        .send(jsonStr)
        .set('Content-Type', 'application/json')
        .set('content-length', jsonStr.length)
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          assert.equal(true, res.body.ok);
          done();
        });
    });

    it('should parse post form request and url query', function (done) {
      core.loadPlugin('parser');
      core.loadPlugin('router', {urlRoot: '^/json'});

      var queryStr = querystring.stringify({key: "value"});

      var routes = {
        receiveForm: {
          url: '^/form/receive',
          method: 'POST',
          handler: function (context) {
            var param = context.param;
            assert.equal(param.key, 'value');
            assert.equal(context.query.name, 'john');
            assert.equal(context.data, queryStr);
            context.sendJSON({ok: true});
          }
        }
      };

      core.mapRoutes(routes);
      server.on('request', core.getListener());

      request(server)
        .post('/form/receive?name=john')
        .send(queryStr)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('content-length', queryStr.length)
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          assert.equal(true, res.body.ok);
          done();
        });
    });

    it('should close connection if max post size exceeded', function (done) {
      core.loadPlugin('parser', {maxIncomingSize: 10});
      core.loadPlugin('router', new Router({urlRoot: '^/json'}));

      var data = "01234567890";

      var routes = {
        receiveMaxExceeded: {
          url: '^/max/exceeded',
          method: 'POST',
          handler: function (context) {
            throw new Error('Connection should be closed due to exceeded max post size.');
          }
        }
      };

      core.mapRoutes(routes);
      server.on('request', core.getListener());

      request(server)
        .post('/max/exceeded')
        .send(data)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect('Connection', 'close')
        .expect(413, "", done);
    });
  });

  describe('.router', function () {
    it('should reply 404 and emit error event if url not matched', function (done) {
      core.loadPlugin('router');

      var routes = {
        index: {
          url: '^/',
          method: 'GET',
          handler: function (context) {
            throw new Error('Request should not be routed here.');
          }
        }
      };

      core.mapRoutes(routes);
      server.on('request', core.getListener());

      request(server)
        .get('/not/existent/url')
        .expect(404, "Content not found: /not/existent/url", done);
    });
  });

  describe('.securecookie', function () {
    var cookie = genji.cookie;

    // options for `secure-cookie` middleware
    var secureCookieOptions = {
      cookieName: '_testSecure',
      secureKey: 'cipher-key',
      serverKey: 'hmac-key',
      cookiePath: '/test',
      cookieDomain: 'test.com'
    };
    // input data
    var now = new Date();
    var userData = {
      cookieId: '12345',
      cookieExpires: new Date((new Date(now.toString())).getTime() + 3600 * 24 * 3 * 1000),
      cookieData: {a: 1}
    };

    var testCookiePlugin = {
      name: 'TestCookie',
      attach: function () {
        return function (req, res, go) {
          if (req.url === '/sign') {
            var parsedData = JSON.parse(req.headers.data);
            var cookieOptions = {
              path: '/test',
              domain: 'test.com'
            };
            var cookie = [parsedData.cookieId, new Date(parsedData.cookieExpires), parsedData.cookieData, cookieOptions];
            this.setCookie('key', 'value', {expires: new Date(parsedData.cookieExpires)});
            this.writeHead(200, {'_testSecure': cookie});
            this.end();
          } else if (req.url === '/verify') {
            var session = this.session;
            assert.equal(session.cookieId, userData.cookieId);
            assert.deepEqual(new Date(session.cookieExpires), userData.cookieExpires);
            assert.equal(session.cookieData.a, userData.cookieData.a);
            this.writeHead(200, {data: JSON.stringify(session)});
            this.end();
          }
        };
      }
    };

    it('should be able to sign and verify cookies', function (done) {
      var site = genji.site();
      site.use('securecookie', secureCookieOptions);
      site.use('cookie');
      site.use(testCookiePlugin);
      var server = http.createServer();
      site.start(server);

      request(server)
        .get('/sign')
        .set('data', JSON.stringify(userData))
        .end(function (err, res) {
          var cookies = res.headers['set-cookie'];
          var normalCookie = cookie.parse(cookies[0]);
          assert.equal('value', normalCookie.key);
          var site = genji.site();
          site.use('securecookie', secureCookieOptions);
          site.use(testCookiePlugin);
          var server = http.createServer();
          site.start(server);
          request(server)
            .get('/verify')
            .set('Cookie', cookies[1])
            .end(function (err, res) {
              var parsedData = JSON.parse(res.headers.data);
              assert.equal(parsedData.cookieId, userData.cookieId);
              assert.deepEqual(new Date(parsedData.cookieExpires), userData.cookieExpires);
              assert.equal(parsedData.cookieData.a, userData.cookieData.a);
              done();
            });
        });
    });
  });

});