"use strict";
var genji = require('../index');
var http = require('http');
var assert = require('assert');
var request = require('supertest');
var querystring = require('querystring');
var Router = genji.Router;

describe('Plugin', function () {
  var core;
  var server;
  beforeEach(function () {
    core = new genji.Core();
    server = http.createServer();
  });

  describe('.parser', function () {
    it('should parse json request', function (done) {
      var core = genji.site({urlRoot: '^/json'});

      var jsonStr = JSON.stringify({key: "value"});

      core.post('/receive$', function (context) {
        var json = context.getDependency('json');
        assert.equal(json.key, 'value');
        assert.equal(context.getDependency('data'), jsonStr);
        context.sendJSON({ok: true});
      });

      core.start(server);

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
      core.use('parser');
      core.use('router', {urlRoot: '^/json', shouldInjectDependency: true, injector: core.injector});

      var queryStr = querystring.stringify({key: "value"});

      core.post('^/form/receive', function (params, query, data, context) {
        assert.equal(params.key, 'value');
        assert.equal(query.name, 'john');
        assert.equal(data, queryStr);
        context.sendJSON({ok: true});
      });

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

    it('should close connection if max post size exceeded', function (done) {
      core.use('parser', {maxIncomingSize: 10});
      core.use('router', new Router({urlRoot: '^/json', shouldInjectDependency: true, injector: core.injector}));

      var data = "01234567890";

      core.post('^/max/exceeded', function (context) {
        throw new Error('Connection should be closed due to exceeded max post size.');
      });

      server.on('request', core.getListener());

      request(server)
        .post('/max/exceeded')
        .send(data)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect('Connection', 'close')
        .expect(413, "", done);
    });
  });

  describe('.router', function () {
    it('should reply 404 and emit error event if url not matched', function (done) {
      core.use('router');

      core.get('^/$', function (context) {
        throw new Error('Request should not be routed here.');
      });

      server.on('request', core.getListener());

      request(server)
        .get('/not/existent/url')
        .expect(404, "Content not found: /not/existent/url", done);
    });
  });

  describe('.view', function () {
    it('should render and reply the content of file', function (done) {
      var engine = {
        render: function (str, ctx) {
          assert.equal('testing data for crypto', str);
          var search = new RegExp(ctx.search);
          var result = str.replace(search, ctx.replace);
          return result;
        }
      };
      core.use('router', {shouldInjectDependency: true, injector: core.injector});
      core.use('view', {engine: engine, rootViewPath: __dirname});

      var routes = [
        ['^/hashfile/with/path', function (context) {
          context.render('view/hashfile.html', {search: 'crypto', replace: "view"});
        }, 'get'],
        ['^/hashfile/direct/render', function (view) {
          var context = this;
          view.renderFile('view/hashfile.html', {search: 'crypto', replace: "html"}, function (err, html) {
            context.sendHTML(html);
          });
        }, 'post'],
        ['^/view/hashfile/custom/callback', function (context) {
          context.render('view/hashfile.html', {search: 'crypto', replace: "view"}, function (err, html) {
            if (err) {
              throw err;
            }
            context.sendHTML(html + '!');
          });
        }, 'get'],
      ];

      core.mount(routes);
      
      server.on('request', core.getListener());

      request(server)
        .get('/hashfile/with/path')
        .expect(200, "testing data for view", function () {
          request(server)
            .get('/view/hashfile/custom/callback')
            .expect(200, "testing data for view!", function () {
              request(server)
                .post('/hashfile/direct/render')
                .expect(200, 'testing data for html', done);
            });
        });
    });

    it('should fail to render and return 503', function (done) {
      var engine = {
        render: function (str, ctx) {
          assert.equal('testing data for crypto', str);
          var search = new RegExp(ctx.search);
          var result = str.replace(search, ctx.replace);
          return result;
        }
      };
      core.use('router');
      core.use('view', {engine: engine, rootViewPath: __dirname});

      core.get('^/unknow/file', function (context) {
        context.render('view/unknow_file.html', {search: 'crypto', replace: "view"});
      });

      server.on('request', core.getListener());

      request(server)
        .get('/unknow/file')
        .expect(503, "Failed to render file", done);
    });
  });

});