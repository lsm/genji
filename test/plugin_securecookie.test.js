var genji = require('../index');
var assert = require('assert');
var http = require('http');

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
        assert.eql(session.cookieId, userData.cookieId);
        assert.eql(new Date(session.cookieExpires), userData.cookieExpires);
        assert.eql(session.cookieData.a, userData.cookieData.a);
        this.writeHead(200, {data: JSON.stringify(session)});
        this.end();
      }
    };
  }
};

exports['test plugin securecookie'] = function () {
  var site = genji.site();
  site.use('securecookie', secureCookieOptions);
  site.use(testCookiePlugin);
  var server = http.createServer();
  site.start(server);
  assert.response(server, {
    url: '/sign',
    timeout: 2000,
    method: 'GET',
    headers: {data: JSON.stringify(userData)}
  }, function (res) {
    var signedCookie = res.headers['set-cookie'];
    var site = genji.site();
    site.use('securecookie', secureCookieOptions);
    site.use(testCookiePlugin);
    var server = http.createServer();
    site.start(server);
    assert.response(server, {
      url: '/verify',
      timeout: 500,
      method: 'GET',
      headers: {'Cookie': signedCookie[0]}
    }, function (res) {
      var parsedData = JSON.parse(res.headers.data);
      assert.eql(parsedData.cookieId, userData.cookieId);
      assert.eql(new Date(parsedData.cookieExpires), userData.cookieExpires);
      assert.eql(parsedData.cookieData.a, userData.cookieData.a);
    });
  });
};
