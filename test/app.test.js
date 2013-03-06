var genji = require('../index');
var assert = require('assert');
var App = genji.App;
var timeout = 500;

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

exports['test define and init app'] = function () {
  var myApp = new MyApp('myApp');
  assert.equal('MyApp', myApp.name);
  assert.equal('myApp', myApp.key);
};

exports['test App callback and event'] = function () {
  var subMyApp = new SubMyApp('key');

  assert.equal('SubMyApp', subMyApp.name);

  subMyApp.on('getName', function () {
    throw new Error('Instance function which returns value should not emit event');
  });

  assert.equal('SubMyApp', subMyApp.getName());

  subMyApp.on('getKey', function (err) {
    if (err !== 'synchronized') {
      throw new Error('Instance function which returns value should not emit event asynchronously');
    }
  });
  assert.equal('key', subMyApp.getKey());

  assert.equal('key', subMyApp.getKey(function (err) {
    if (err !== 'synchronized') {
      throw new Error('If instance function returns a value other than undefined callback should not be called asynchronously');
    }
  }));

  var input = 'hello';

  subMyApp.on('doAsyncJob', function (err, result) {
    assert.equal(this, subMyApp);
    assert.equal(null, err);
    assert.equal(input, result);
  });

  assert.isUndefined(subMyApp.doAsyncJob(input));

  subMyApp.doAsyncJob('world', function (err, result) {
    assert.equal(this, subMyApp);
    assert.equal(null, err);
    assert.equal('world', result);
  })
};

exports['test prefixed event on delegation'] = function () {
  var subMyApp = new SubMyApp('key');
  var emitter = new MyApp;
  subMyApp.delegate = emitter;

  emitter.on('SubMyApp:doAsyncJob', function (err, result) {
    assert.equal('hello', result);
    subMyApp.prefixDelegatedEvent = 'CustomPrefix';
    subMyApp.doAsyncJob('world');
  });

  subMyApp.doAsyncJob('hello');

  emitter.on('CustomPrefix:doAsyncJob', function (err, result) {
    assert.equal('world', result);
  });
};