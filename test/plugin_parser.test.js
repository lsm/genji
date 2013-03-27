var genji = require('../index');
var http = require('http');
var assert = require('assert');
var request = require('supertest');

describe('Plugin', function () {
  var App = genji.App;
  var core;
  var server;
  beforeEach(function () {
    core = new genji.Core();
    server = http.createServer();
  });

  describe('.parser', function () {
    it('should parse json request', function (done) {
      core.loadPlugin('parser');
      core.loadPlugin('router', {urlRoot: '^/json'});

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

      core.mapRoutes(routes);
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
});