// require the genji lib
var genji = require('genji');

var providers = [
  {
    namespace: 'account',
    methods: {
       // rpc.call('account.login', params: ['john', 'pass']);
      login: function(username, password, callback) {
        callback(null, 'Welcome ' + username + ' your password is ' + password);
      }
    }
  }
];

genji
    .use('error-handler', {uncaughtException: true})
    .use('logger')
    .use('dev-verbose', {requestHeader: true, requestBody: true})
    .use('jsonrpc', {endpoint: '^/jsonrpc/$', providers: providers})
    .use('print-response', {name: 'dev-verbose', responseHeader: true,
      responseBody: true});

// create a http server
var server = genji.createServer();

// start handling request
server.listen(8888, '127.0.0.1');

// now run following command in terminal:
/*
 curl -X POST -H "Content-Type:application/json" \
 http://127.0.0.1:8888/jsonrpc/ \
 -d '{"jsonrpc":"2.0", "method": "account.login", "params":["john", "pass"], "id": 1}'
 */