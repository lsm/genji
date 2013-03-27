var genji = require('../index');
var assert = require('assert');
var http = require('http');
var request = require('supertest');

// options for `secure-cookie` middleware
var secureCookieOptions = {cookieName: '_testSecure', path: '../../lib/middleware', secureKey: 'cipher-key', serverKey: 'hmac-key'};
// input data
var now = new Date();
var userData = {cookieId: '12345', cookieExpires: new Date((new Date(now.toString())).getTime() + 3600 * 24 * 3 * 1000), cookieData: {a: 1}};

var testCookiePlugin = {
  name: 'TestCookie',
  attach: function () {
    return function (req, res, go) {
      if (req.url === '/sign') {
        var parsedData = JSON.parse(req.headers.data);
        var cookie = [parsedData.cookieId, new Date(parsedData.cookieExpires), parsedData.cookieData];
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

describe('Plugin', function () {
  describe('.securecookie', function () {
    it('should be able to sign and verify cookies', function (done) {
      var site = genji.site();
      site.use('securecookie', secureCookieOptions);
      site.use(testCookiePlugin);
      var server = http.createServer();
      site.start(server);

      request(server)
        .get('/sign')
        .set('data', JSON.stringify(userData))
        .end(function (err, res) {
          var signedCookie = res.headers['set-cookie'];
          var site = genji.site();
          site.use('securecookie', secureCookieOptions);
          site.use(testCookiePlugin);
          var server = http.createServer();
          site.start(server);
          request(server)
            .get('/verify')
            .set('Cookie', signedCookie[0])
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