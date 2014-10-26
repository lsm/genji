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
    core.use('router', {urlRoot: '^/json', shouldInjectDependency: true, injector: core.injector});

    var jsonStr = JSON.stringify({key: "value"});

    core.post('/receive$', function (context, json, data) {
      assert.equal(json.key, 'value');
      assert.equal(data, jsonStr);
      context.sendJSON({ok: true});
    });

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
});