var genji = require('../index');
var Router = genji.Router;
var assert = require('assert');

describe('Router', function () {

  it('should route by definitions', function () {

    var helloGet, helloPost, preHook1, preHook2, preHook3 = 0, postHook1 = 0, preHookSub1, preHookSub2,
      hello2Get, notFound, notFound2, sub1, sub2, sub3, sub4, globalPreHook = 0, globalPostHook = 0,
      defaultContext = 0, nestedSub, nestedSub2, override;

    function DefaultContext() {
      defaultContext++;
    }

    function globalPreHookFn(context) {
      globalPreHook++;
      return true;
    }

    function globalPostHookFn(context, next) {
      globalPostHook++;
      next();
    }

    function helloGetFn(context) {
      helloGet = true;
      assert.equal(true, context instanceof DefaultContext);
      return true;
    }

    function helloPostFn(context) {
      helloPost = true;
      assert.equal(true, context instanceof DefaultContext);
      return true;
    }

    function hello2GetFn(context) {
      hello2Get = true;
      assert.equal(true, context instanceof DefaultContext);
    }

    function preHook1Fn(context) {
      preHook1 = true;
      assert.equal(true, context instanceof DefaultContext);
      return true;
    }

    function preHook2Fn(context, next) {
      preHook2 = true;
      assert.equal(true, context instanceof DefaultContext);
      next();
    }

    function notFoundFn(context) {
      notFound = true;
      assert.equal(true, context instanceof DefaultContext);
    }

    function sub1Fn(context) {
      sub1 = true;
      assert.equal(true, context instanceof DefaultContext);
      return true;
    }

    function preHookSub1Fn() {
      if (preHook3 === 1) {
        preHookSub1 = true;
        return true;
      }
    }

    function sub2Fn(context) {
      sub2 = true;
      assert.equal(true, context instanceof DefaultContext);
      return true;
    }

    function sub3Fn(context) {
      sub3 = true;
      assert.equal(true, context instanceof DefaultContext);
      return false;
    }

    function preHookSub2Fn() {
      if (preHook3 === 3) {
        preHookSub2 = true;
        return true;
      }
    }

    function sub4Fn(context) {
      sub4 = true;
      assert.equal(true, context instanceof DefaultContext);
      return true;
    }

    function preHook3Fn(context, next) {
      preHook3++;
      if (preHook3 < 3) {
        assert.equal(true, context instanceof DefaultContext);
      } else {
        assert.equal(true, context instanceof DefaultContext);
      }
      next();
    }

    function postHook1Fn(context) {
      postHook1++;
      if (postHook1 < 3) {
        assert.equal(true, context instanceof DefaultContext);
      } else {
        assert.equal(true, context instanceof DefaultContext);
      }
      return true;
    }

    function nestedSubFn(context) {
      nestedSub = true;
      assert.equal(true, context instanceof DefaultContext);
      return true;
    }

    function nestedSub2Fn(context, next) {
      nestedSub2 = true;
      assert.equal(true, context instanceof DefaultContext);
      next();
    }

    var urls = [
      ['^/hello/$', helloGetFn, 'get'],
      ['^/hello/$', helloPostFn, 'post'],
      ['^/hello2/$', hello2GetFn, 'get', [preHook1Fn, preHook2Fn]],
      ['^/', notFoundFn, 'notfound'],
      ['^/parent/', [
        ['^sub1/$', sub1Fn, [preHookSub1Fn]],
        ['^sub2/$', sub2Fn, 'post'],
        ['^sub3/$', sub3Fn, preHookSub2Fn],
        ['^sub4/$', sub4Fn]
      ], 'get', [preHook3Fn, null, postHook1Fn]],
      ['^/a/', [
        ['^b/', [
          ['^c/', [
            ['^d/$', nestedSubFn, 'post']
          ]]
        ]],
        ['^1/', [
          ['^2/', [
            ['^3/$', nestedSub2Fn]
          ], 'delete']
        ], 'put']
      ]],
      ['^/override/$', function () {
        throw new Error('This function should be overridden');
      }, 'post']
    ];

    function getContext() {
      return new DefaultContext();
    }

    var _router = new Router(urls);

    _router.post('^/override/$', function () {
      override = true;
    });

    // do matching
    _router.route('GET', '/hello/', getContext());

    _router.hook([globalPreHookFn, null, globalPostHookFn]);

    _router.route('POST', '/hello/', getContext());
    _router.route('GET', '/hello2/', getContext());
    _router.route('HEAD', '/hello/', getContext());
    _router.route('GET', 'hello/', getContext(), function () {
      notFound2 = true;
    });
    _router.route('GET', '/parent/sub1/', getContext());
    _router.route('POST', '/parent/sub2/', getContext());
    _router.route('GET', '/parent/sub3/', getContext());
    _router.route('GET', '/parent/sub4/', getContext());
    _router.route('POST', '/a/b/c/d/', getContext());
    _router.route('DELETE', '/a/1/2/3/', getContext());
    _router.route('POST', '/override/', getContext());

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
    assert.equal(defaultContext, 12);
    assert.equal(globalPreHook, 10);
    assert.equal(globalPostHook, 6);
    assert.equal('app/function/name', _router.slashCamelCase('appFunctionName'));
    assert.equal('^/prefix/url', _router.prefixUrl('^/prefix/', '/url'));
    assert.equal('^/url', _router.prefixUrl('^/prefix', '^/url'));
    try {
      (new Router([
        [1, function () {
        }]
      ], {})).getRoutes();
      assert.equal(1, 2); // should never be called
    } catch (e) {
      assert.equal(e.message, 'Invalid url pattern');
    }
  });

});