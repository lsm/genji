var genji = require('../index');
var assert = require('assert');
var App = genji.App;

describe('App', function () {

  var MyApp = App({
    name: 'MyApp',
    init: function (key) {
      this.key = key;
    },

    getName: function () {
      return this.name;
    }
  });

  var SubMyApp = MyApp({
    name: 'SubMyApp',
    getKey: function (cb) {
      cb('synchronized');
      process.nextTick(function () {
        cb && cb(null);
      });
      return this.key;
    },

    doAsyncJob: function (input, cb) {
      assert.equal('function', typeof cb);
      process.nextTick(function () {
        cb(null, input);
      });
    }
  });

  it('should inherit from App and sub-app', function () {
    assert.equal(true, (new MyApp()) instanceof App);
    assert.equal('string', typeof MyApp.prototype.name);
    assert.equal('function', typeof MyApp.prototype.init);
    assert.equal('function', typeof MyApp.prototype.getName);

    assert.equal(true, (new SubMyApp()) instanceof App);
    assert.equal(true, (new SubMyApp()) instanceof MyApp);
    assert.equal('string', typeof SubMyApp.prototype.name);
    assert.equal('function', typeof SubMyApp.prototype.init);
    assert.equal('function', typeof SubMyApp.prototype.getName);
    assert.equal('function', typeof SubMyApp.prototype.getKey);
    assert.equal('function', typeof SubMyApp.prototype.doAsyncJob);
  });


  it('should initialise app and set property', function () {
    var myApp = new MyApp('myApp');
    assert.equal('MyApp', myApp.name);
    assert.equal('myApp', myApp.key);
  });

  it('should not emit event or exxcute callback for method that returns value', function () {
    var subMyApp = new SubMyApp('key');

    subMyApp.on('getName', function () {
      throw new Error('Instance function which returns value should not emit event');
    });

    subMyApp.on('getKey', function (err) {
      if (err !== 'synchronized') {
        throw new Error('Instance function which returns value should not emit event asynchronously');
      }
    });

    assert.equal('SubMyApp', subMyApp.name);
    assert.equal('SubMyApp', subMyApp.getName());
    assert.equal('key', subMyApp.getKey());
    assert.equal('key', subMyApp.getKey(function (err) {
      if (err !== 'synchronized') {
        throw new Error('If instance function returns a value other than undefined callback should not be called asynchronously');
      }
    }));
  });

  it('should handle result by callback and emit event by config', function (done) {
    var subMyApp = new SubMyApp('key');
    var input = 'hello';
    var count = 0;

    subMyApp.on('doAsyncJob', function (err, result) {
      assert.equal(this, subMyApp);
      assert.equal(null, err);
      if (0 === count) {
        count++;
        assert.equal(input, result);
      } else if (1 === count) {
        assert.equal('world', result);
        done();
      }
    });

    assert.equal(undefined, subMyApp.doAsyncJob(input));

    subMyApp.emitInlineCallback = 'after';

    subMyApp.doAsyncJob('world', function (err, result) {
      assert.equal(this, subMyApp);
      assert.equal(null, err);
      assert.equal('world', result);
    });
  });

  it('should prefix event with app name on delegation', function (done) {
    var subMyApp = new SubMyApp('key');
    var emitter = new MyApp();
    subMyApp.delegate = emitter;

    emitter.on('SubMyApp:doAsyncJob', function (app, err, result) {
      assert.equal(app, subMyApp);
      assert.equal('hello', result);
      subMyApp.prefixDelegatedEvent = 'CustomPrefix';
      subMyApp.doAsyncJob('world');
    });

    subMyApp.doAsyncJob('hello');

    emitter.on('CustomPrefix:doAsyncJob', function (app, err, result) {
      assert.equal(app, subMyApp);
      assert.equal('world', result);
      done();
    });
  });
});