var genji = require('../index');
var http = require('http');
var assert = require('assert');
var timeout = 500;

exports['test parser and router plugins'] = function () {
  var core = new genji.Core();
  core.loadPlugin('parser');
  core.loadPlugin('router', {urlRoot: '^/json'});

  var jsonStr = JSON.stringify({key: "value"});

  var routes = {
    receiveJSON: {
      url: '/receive$',
      method: 'POST',
      handleFunction: function (context) {
        context.on('json', function (json, data, error) {
          if (!error) {
            assert.eql(json.key, 'value');
            assert.eql(data, jsonStr);
            context.sendJSON({ok: true});
          }
        });
      }
    }
  };

  core.mapRoutes(routes);
  var server = http.createServer(core.getListener());

  assert.response(server, {
    url: '/json/receive',
    timeout: timeout,
    data: jsonStr,
    method: 'POST',
    headers: {'content-length': jsonStr.length}
  }, function (res) {
    var json = JSON.parse(res.body);
    assert.eql(json.ok, true);
    assert.eql(res.statusCode, 200);
    assert.eql(res.headers['content-type'], 'application/json; charset=utf-8');
  });
};

exports['test app auto routing'] = function () {
  var App = genji.App;
  var core = new genji.Core();
  core.loadPlugin('parser');
  core.loadPlugin('router');

  var result = 'Test result!';

  var TestApp = App({
    name: 'Test',
    exampleFunction: function (callback) {
      callback(null, result);
    }
  });

  var testApp = new TestApp();
  core.mapRoutes(testApp);
  var server = http.createServer(core.getListener());

  assert.response(server, {
    url: '/test/example/function',
    timeout: timeout,
    method: 'GET'
  }, function (res) {
    assert.eql(res.body, result);
    assert.eql(res.statusCode, 200);
    assert.eql(res.headers['content-type'], 'text/html; charset=utf-8');
  });
};

exports['test app customized routing and hooks'] = function () {
  var App = genji.App;
  var core = new genji.Core();
  core.loadPlugin('router');

  var result = 'Test result!';

  var TestApp = App({
    name: 'Test',
    exampleFunction: function (session, param, callback) {
      assert.eql('test', param);
      assert.eql('john', session.user);
      callback(null, {user: session.user, message: result});
    }
  });

  var testApp = new TestApp();

  var preHook = function (context, param, next) {
    assert.eql('test', param);
    context.session = {user: 'john'};
    setTimeout(next, 50);
  };

  var postHook = function (context, param, next) {
    assert.eql('test', param);
    assert.eql('john', context.session.user);
  };

  var routes = {
    customized: {hooks: [null, postHook]},
    testExampleFunction: {url: '^/example/(.*)', view: 'json', hooks: [preHook, null, postHook]},
    customizedRoute: {url: '^/another/example/(.*)', method: 'post', handleFunction: function (context, param, next) {
      context.session = {user: 'john'};
      assert.eql('test', param);
      context.send(result);
      return true;
    }}
  };

  core.mapRoutes(routes, testApp);
  core.mapRoutes(routes);
  var server = http.createServer(core.getListener());

  assert.response(server, {
    url: '/example/test',
    timeout: timeout,
    method: 'GET'
  }, function (res) {
    var json = JSON.parse(res.body);
    assert.eql('john', json.user);
    assert.eql(result, json.message);
    assert.eql(res.statusCode, 200);
    assert.eql(res.headers['content-type'], 'application/json; charset=utf-8');
  });

  assert.response(server, {
    url: '/another/example/test',
    timeout: timeout,
    method: 'POST'
  }, function (res) {
    assert.eql(result, res.body);
    assert.eql(res.statusCode, 200);
    assert.eql(res.headers['content-type'], 'text/plain');
  });
};