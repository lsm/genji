var genji = require('genji'),
    assert = require('assert'),
    afterCalled = false;

var jsonrpc = {endpoint: '^/jsonrpc/$',
  providers: [
    {
      namespace: 'account',
      methods: {
        login: function(username, password, callback) {
          callback(null, [username, password].join(','));
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
  ]};


exports['test middleware jsonrpc'] = function() {
  var server = genji.use('jsonrpc', jsonrpc).createServer();
  assert.response(server, {
        url: '/jsonrpc/',
        timeout: 500,
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
