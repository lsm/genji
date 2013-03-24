var genji = require('../index');
var Auth = genji.auth;
var assert = require('assert');


describe('Auth', function () {

  it('should sign and verify messages', function () {
    var secureKey = '1amverysecure';
    var signed = Auth.sign('John', 'After a year', {a: 1, b: 2}, secureKey);
    var signedArray = signed.split('|').slice(0, 3);
    assert.deepEqual(signedArray, Auth.verify('John|After a year|{"a":1,"b":2}|41701025e5be371ecd5247ec097ea3d2f8cbbbcc', '1amverysecure'));
  });

  it('should generate password and check it', function () {
    var pass = Auth.makePassword('password');
    assert.equal(true, Auth.checkPassword(pass, 'password'));
    assert.equal(false, Auth.checkPassword(pass, 'password1'));
    assert.equal(false, Auth.checkPassword('xx$xx', 'password'));
  });

});