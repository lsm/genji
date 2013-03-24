var genji = require('../index');
var http = require('http');
var assert = require('assert');
var request = require('supertest');

describe('Site', function () {
  var App = genji.App;
  var site;
  var server;
  beforeEach(function () {
    site = new genji.site();
    server = http.createServer();
  });

  it('should use parser plugin and parse requesting data', function (done) {
    process.env.NODE_ENV = 'production';
    site.use('parser');
    var result = 'result';

    site.map({
      testParser: {
        handler: function (context) {
          assert.equal('value', context.query.key);
          context.send(result);
        }
      }
    });

    site.start(server);

    request(server)
      .get('/test/parser?key=value')
      .expect('Content-Type', 'text/plain')
      .expect(200, result, done);
  });

  it('should load app and routing request base on convention', function (done) {
    site.use('parser');
    site.set('key', 'value');

    site.env('dev');
    site.set('name', 'DevName');
    site.set('appOptions', {env: 'dev'});

    site.env('production');
    site.set('name', 'ProductionName');
    site.set('appOptions', {env: 'production'});

    process.env.NODE_ENV = 'dev';

    assert.deepEqual({key: 'value', name: 'DevName'}, site.get(['key', 'name']));

    var result = 'result';
    var TestApp = App({
      name: 'Test',
      emitInlineCallback: 'before',
      init: function (options) {
        assert.equal('dev', options.env);
      },
      exampleFunction: function (callback) {
        callback(null, result);
      }
    });

    site.on('testExampleFunction', function (err, _result) {
      assert.equal(result, _result);
    });

    site.env('dev')
      .load(TestApp)
      .start(server);

    request(server)
      .get('/test/example/function')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(200, result, done);
  });

});