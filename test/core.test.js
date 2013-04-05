var genji = require('../index');
var http = require('http');
var assert = require('assert');
var request = require('supertest');

describe('Core', function () {
  var App = genji.App;
  var core;
  var server;
  beforeEach(function () {
    core = new genji.Core();
    server = http.createServer();
  });

  it('should use parser and router plugins to route and parse json request', function (done) {
    core.use('parser');
    core.use('router', {urlRoot: '^/json'});

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

    core.map(routes);
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

  describe('.load', function () {
    it('should load app and map public function to route automatically', function (done) {
      core.use('router');
      var result = 'Test result!';

      var TestApp = App({
        name: 'Test',
        exampleFunction: function (callback) {
          callback(null, result);
        }
      });

      var testApp = new TestApp();
      core.load(testApp);
      server.on('request', core.getListener());

      request(server)
        .get('/test/example/function')
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(200, result, done);
    });

    it('should load app and use customized routes and hooks', function (done) {
      core.use('router');

      var result = 'Test result!';

      var TestApp = App({
        name: 'Test',
        exampleFunction: function (session, param, callback) {
          assert.equal('test', param);
          assert.equal('john', session.user);
          callback(null, {user: session.user, message: result});
        }
      });

      var testApp = new TestApp();

      var preHook = function (context, param, next) {
        assert.equal('test', param);
        context.session = {user: 'john'};
        setTimeout(next, 50);
      };

      var postHook = function (context, param, next) {
        assert.equal('test', param);
        assert.equal('john', context.session.user);
      };

      var routes = {
        customized: {hooks: [null, postHook]},
        testExampleFunction: {url: '^/example/(.*)', view: 'json', hooks: [preHook, null, postHook]},
        customizedRoute: {url: '^/another/example/(.*)', method: 'post', handler: function (context, param, next) {
          context.session = {user: 'john'};
          assert.equal('test', param);
          context.send(result);
          return true;
        }}
      };

      core.load(testApp);
      core.map(routes);
      core.map(routes);
      server.on('request', core.getListener());

      request(server)
        .get('/example/test')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          var json = res.body;
          assert.equal('john', json.user);
          assert.equal(result, json.message);
          request(server)
            .post('/another/example/test')
            .expect('Content-Type', 'text/plain')
            .expect(200, result, done);
        });
    });
  });
});