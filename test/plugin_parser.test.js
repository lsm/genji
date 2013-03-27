var genji = require('../index');
var http = require('http');
var assert = require('assert');
var request = require('supertest');
var querystring = require('querystring');

describe('Plugin', function () {
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

    it('should parse post form request and url query', function (done) {
      core.loadPlugin('parser');
      core.loadPlugin('router', {urlRoot: '^/json'});

      var queryStr = querystring.stringify({key: "value"});

      var routes = {
        receiveForm: {
          url: '^/form/receive',
          method: 'POST',
          handler: function (context) {
            var param = context.param;
            assert.equal(param.key, 'value');
            assert.equal(context.query.name, 'john');
            assert.equal(context.data, queryStr);
            context.sendJSON({ok: true});
          }
        }
      };

      core.mapRoutes(routes);
      server.on('request', core.getListener());

      request(server)
        .post('/form/receive?name=john')
        .send(queryStr)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('content-length', queryStr.length)
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

    it('should drop connection if max post size exceeded', function (done) {
      core.loadPlugin('parser', {maxIncomingSize: 10});
      core.loadPlugin('router', {urlRoot: '^/json'});

      var data = "01234567890";

      var routes = {
        receiveMaxExceeded: {
          url: '^/max/exceeded',
          method: 'POST',
          handler: function (context) {
            throw new Error('Connection should be dropped due to exceeded max post size.');
          }
        }
      };

      core.mapRoutes(routes);
      server.on('request', core.getListener());

      request(server)
        .post('/max/exceeded')
        .send(data)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect('Connection', 'close')
        .expect(413, "", done);
    });
  });
});