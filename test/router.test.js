var genji = require('genji');
var router = genji.require('router');
var assert = require('assert');

module.exports = {
  'test router': function() {
    var helloGet, helloPost, preHook1, preHook2, preHook3 = 0, preHookSub1, preHookSub2,
        hello2Get, notFound, notFound2, sub1, sub2, sub3, sub4,
        defaultHandler = 0, anotherHandler = 0, nestedSub, nestedSub2;

    function DefaultHandler() {
      defaultHandler++;
    }

    function AnotherHandler() {
      anotherHandler++;
    }

    var urls = [
      ['^/hello/$', function() {
        helloGet = true;
      }, 'get'],
      ['^/hello/$', function() {
        helloPost = true;
      }, 'post'],
      ['^/hello2/$', [
        function() {
          if (preHook2) {
            preHook1 = true;
            return true;
          }
        },
        function() {
          hello2Get = true;
        }
      ], 'get', {pre: [
        function() {
          preHook2 = true;
          return true;
        }
      ]}
      ],
      ['^/', function() {
        notFound = true;
      }, 'notfound', AnotherHandler],
      ['^/parent/', [
        [
          '^sub1/$', function() {
          sub1 = true;
        },  {pre: [function() {
          if (preHook3 == 1) {
            preHookSub1 = true;
            return true;
          }
        }]}
        ],
        [
          '^sub2/$', function() {
          sub2 = true
        }, 'post'
        ],
        [
          '^sub3/$', function() {
          sub3 = true;
        },  DefaultHandler, {pre: [function() {
          if (preHook3 == 3) {
            preHookSub2 = true;
            return true;
          }
        }]}
        ],
        [
          '^sub4/$', function() {
          sub4 = true;
        },  DefaultHandler
        ]
      ], 'get', AnotherHandler, {pre: [function() {
        preHook3++;
        this.next();
      }
      ]}
      ],
      ['^/a/', [
        ['^b/', [
          ['^c/', [
            ['^d/$', function() {
              nestedSub = true;
            }, 'post', AnotherHandler]
          ]]
        ]],
        ['^1/', [
          ['^2/', [
            ['^3/$', function() {
              nestedSub2 = true
            }, AnotherHandler]
          ], 'delete']
        ], 'put']
      ]]
    ];
    var r = new router.Router(urls, DefaultHandler);
    var rules = r.toRules();
    var route = router.route;
    // do matching
    route({type: 'GET', condition: '/hello/'}, rules);
    route({type: 'POST', condition: '/hello/'}, rules);
    route({type: 'GET', condition: '/hello2/'}, rules);
    route({type: 'HEAD', condition: '/hello/'}, rules);
    route({type: 'GET', condition: 'hello/'}, rules, function() {
          notFound2 = true;
        });
    route({type: 'GET', condition: '/parent/sub1/'}, rules);
    route({type: 'POST', condition: '/parent/sub2/'}, rules);
    route({type: 'GET', condition: '/parent/sub3/'}, rules);
    route({type: 'GET', condition: '/parent/sub4/'}, rules);
    route({type: 'POST', condition: '/a/b/c/d/'}, rules);
    route({type: 'DELETE', condition: '/a/1/2/3/'}, rules);

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
    assert.equal(preHook3, 4);
    assert.equal(defaultHandler, 5);
    assert.equal(anotherHandler, 5);
    try {
      (new router.Router([
        [1, function() {
        }]
      ])).toRules();
      assert.equal(1, 2); // should never be called
    } catch (e) {
      assert.equal(e.message, 'Invaild url pattern');
    }
  }
}