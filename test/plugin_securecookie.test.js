var genji = require('../index');
var assert = require('assert');

// options for `secure-cookie` middleware
var secureCookie = {cookieName: '_testSecure', path: '../../lib/middleware', secureKey: 'cipher-key', serverKey: 'hmac-key'};
// input data
var now = new Date();
var userData = {id:'12345', expires: new Date((new Date(now.toString())).getTime() + 3600*24*3*1000), data: {a: 1}};

var testCookie = {
  module: {
    name: 'TestCookie',
    make: function() {
      return function(req, res, go) {
        if (req.url === '/sign') {
          var parsedData = JSON.parse(req.headers.data);
          var cookie = [parsedData.id, new Date(parsedData.expires), parsedData.data];
          this.writeHead(200, {'_testSecure': cookie});
          this.end();
        } else if (req.url === '/verify') {
          var user = this.userObj;
          assert.eql(user.id, userData.id);
          assert.eql(new Date(user.expires), userData.expires);
          assert.eql(user.data.a, userData.data.a);
          this.writeHead(200, {data: JSON.stringify(user)});
          this.end();
        }
      }
    }
  }
};

genji.use('secure-cookie', secureCookie);
genji.use('testCookie', testCookie);

exports['test middleware secure-cookie'] = function() {

  assert.response(genji.createServer(), {
        url: '/sign',
        timeout: 2000,
        method: 'GET',
        headers: {data: JSON.stringify(userData)}
      }, function(res) {
        var signedCookie = res.headers['set-cookie'];
        assert.response(genji.createServer(), {
          url: '/verify',
          timeout: 500,
          method: 'GET',
          headers: {'Cookie': signedCookie[0]}
        }, function(res) {
            var parsedData = JSON.parse(res.headers.data);
            assert.eql(parsedData.id, userData.id);
            assert.eql(new Date(parsedData.expires), userData.expires);
            assert.eql(parsedData.data.a, userData.data.a);
        });
      });
};
