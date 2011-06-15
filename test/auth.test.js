var Auth = require('../lib/genji/auth');
var assert = require('assert');

module.exports = {
  'test Auth#sign/verify': function() {
    var secureKey = '1amverysecure';
    var signed = Auth.sign('John', 'After a year', {a:1,b:2}, secureKey);
    var signedArray = signed.split('|').slice(0, 3);
    assert.eql(signedArray, Auth.verify('John|After a year|{"a":1,"b":2}|41701025e5be371ecd5247ec097ea3d2f8cbbbcc', '1amverysecure'));
  },

  'test Auth#makePassword/checkPassword': function() {

  }
}