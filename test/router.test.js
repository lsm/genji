var genji = require('../index');
var router = genji.router;
var assert = require('assert');

module.exports = {
  'test router': function () {
    var helloGet, helloPost, preHook1, preHook2, preHook3 = 0, postHook1 = 0, preHookSub1, preHookSub2,
      hello2Get, notFound, notFound2, sub1, sub2, sub3, sub4, globalPreHook = 0, globalPostHook = 0,
      defaultHandler = 0, anotherHandler = 0, nestedSub, nestedSub2, override;

    function DefaultHandler() {
      defaultHandler++;
    }

    function AnotherHandler() {
      anotherHandler++;
    }

    function globalPreHookFn(handler) {
      globalPreHook++;
      return true;
    }

    function globalPostHookFn(handler, next) {
      globalPostHook++;
      next();
    }

    function helloGetFn(handler) {
      helloGet = true;
      assert.equal(true, handler instanceof DefaultHandler);
      return true;
    }

    function helloPostFn(handler) {
      helloPost = true;
      assert.equal(true, handler instanceof DefaultHandler);
      return true;
    }

    function hello2GetFn(handler) {
      hello2Get = true;
      assert.equal(true, handler instanceof DefaultHandler);
    }

    function preHook1Fn(handler) {
      preHook1 = true;
      assert.equal(true, handler instanceof DefaultHandler);
      return true;
    }

    function preHook2Fn(handler, next) {
      preHook2 = true;
      assert.equal(true, handler instanceof DefaultHandler);
      next();
    }

    function notFoundFn(handler) {
      notFound = true;
      assert.equal(true, handler instanceof AnotherHandler);
    }

    function sub1Fn(handler) {
      sub1 = true;
      assert.equal(true, handler instanceof AnotherHandler);
      return true;
    }

    function preHookSub1Fn() {
      if (preHook3 === 1) {
        preHookSub1 = true;
        return true;
      }
    }

    function sub2Fn(handler) {
      sub2 = true;
      assert.equal(true, handler instanceof AnotherHandler);
      return true;
    }

    function sub3Fn(handler) {
      sub3 = true;
      assert.equal(true, handler instanceof DefaultHandler);
      return false;
    }

    function preHookSub2Fn() {
      if (preHook3 === 3) {
        preHookSub2 = true;
        return true;
      }
    }

    function sub4Fn(handler) {
      sub4 = true;
      assert.equal(true, handler instanceof DefaultHandler);
      return true;
    }

    function preHook3Fn(handler, next) {
      preHook3++;
      if (preHook3 < 3) {
        assert.equal(true, handler instanceof AnotherHandler);
      } else {
        assert.equal(true, handler instanceof DefaultHandler);
      }
      next();
    }

    function postHook1Fn(handler) {
      postHook1++;
      if (postHook1 < 3) {
        assert.equal(true, handler instanceof AnotherHandler);
      } else {
        assert.equal(true, handler instanceof DefaultHandler);
      }
      return true;
    }

    function nestedSubFn(handler) {
      nestedSub = true;
      assert.equal(true, handler instanceof AnotherHandler);
      return true;
    }

    function nestedSub2Fn(handler, next) {
      nestedSub2 = true;
      assert.equal(true, handler instanceof AnotherHandler);
      next();
    }

    var urls = [
      ['^/hello/$', helloGetFn, 'get'],
      ['^/hello/$', helloPostFn, 'post'],
      ['^/hello2/$', hello2GetFn, 'get', {hooks: [preHook1Fn, preHook2Fn]}],
      ['^/', notFoundFn, 'notfound', AnotherHandler],
      ['^/parent/', [
        ['^sub1/$', sub1Fn, [preHookSub1Fn]],
        ['^sub2/$', sub2Fn, 'post'],
        ['^sub3/$', sub3Fn, {hooks: preHookSub2Fn, handlerClass: DefaultHandler}],
        ['^sub4/$', sub4Fn, DefaultHandler]
      ], 'get', {handlerClass: AnotherHandler, hooks: [preHook3Fn, null, postHook1Fn]}],
      ['^/a/', [
        ['^b/', [
          ['^c/', [
            ['^d/$', nestedSubFn, 'post', AnotherHandler]
          ]]
        ]],
        ['^1/', [
          ['^2/', [
            ['^3/$', nestedSub2Fn, AnotherHandler]
          ], 'delete']
        ], 'put']
      ]],
      ['^/override/$', function () {
        throw new Error('This function should be overridden');
      }, 'post']
    ];

    var _router = new router.Router(urls, {defaultHandlerClass: DefaultHandler});

    _router.add('post', '^/override/$', function () {
      override = true;
    });

    // do matching
    _router.route('GET', '/hello/', this);

    _router.hook([globalPreHookFn, null, globalPostHookFn]);

    _router.route('POST', '/hello/', this);
    _router.route('GET', '/hello2/', this);
    _router.route('HEAD', '/hello/', this);
    _router.route('GET', 'hello/', this, function () {
      notFound2 = true;
    });
    _router.route('GET', '/parent/sub1/', this);
    _router.route('POST', '/parent/sub2/', this);
    _router.route('GET', '/parent/sub3/', this);
    _router.route('GET', '/parent/sub4/', this);
    _router.route('POST', '/a/b/c/d/', this);
    _router.route('DELETE', '/a/1/2/3/', this);
    _router.route('POST', '/override/', this);

    // check results
    assert.equal(helloGet, true);
    assert.equal(helloPost, true);
    assert.equal(hello2Get, true);
    assert.equal(preHook1, true);
    assert.equal(preHook2, true);
    assert.equal(preHookSub1, true);
    assert.equal(preHookSub2, true);
    assert.equal(notFound, true);
    assert.equal(notFound2, true);
    assert.equal(sub1, true);
    assert.equal(sub2, true);
    assert.equal(sub3, true);
    assert.equal(sub4, true);
    assert.equal(nestedSub, true);
    assert.equal(nestedSub2, true);
    assert.equal(override, true);
    assert.equal(preHook3, 4);
    assert.equal(postHook1, 3);
    assert.equal(defaultHandler, 6);
    assert.equal(anotherHandler, 5);
    assert.equal(globalPreHook, 10);
    assert.equal(globalPostHook, 6);
    try {
      (new router.Router([
        [1, function () {
        }]
      ], {})).getRoutes();
      assert.equal(1, 2); // should never be called
    } catch (e) {
      assert.equal(e.message, 'Invaild url pattern');
    }
  }
};