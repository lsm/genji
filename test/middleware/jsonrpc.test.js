var genji = require('genji'),
    assert = require('assert'),
    afterCalled = false;

var middlewares = {
  'response-time': {path: 'genji/web/middleware'},
  jsonrpc: {path: 'genji/web/middleware', endpoint: '^/jsonrpc/$', providers: [
    {
      namespace: 'account',
      methods: {
        login: function(username, password, callback) {
          callback(null, [username, password].join(','));
          return true;
        },
        signup: function(email, username, password, callback) {
          callback(null, [email, username, password].join(','));
          return true;
        }
      },
      before: function(username, password, callback) {
        this.next(username * 10, password, callback);
      },
      after: function() {
        afterCalled = true;
      }
    }
  ]}
};


var server = genji.web.createServer(middlewares);

exports['test middleware jsonrpc'] = function() {
  assert.response(server, {
        url: '/jsonrpc/',
        timeout: 100,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: '{ "jsonrpc": "2.0", "method": "account.login", "params": [1,2], "id":2 }'
      }, function(res) {
        var body = JSON.parse(res.body);
        assert.equal(res.headers['content-type'], 'application/json; charset=utf8');
        assert.equal(body.result, '10,2');
        assert.equal(body.id, 2);
        assert.equal(afterCalled, true);
      });
};
