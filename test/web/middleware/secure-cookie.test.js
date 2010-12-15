var genji = require('genji'),
crypto = require('crypto')
cookie = genji.web.cookie;
var assert = require('assert');

var expires = new Date('Sat, 06 Jul 2024 10:58:58 GMT'),
cookieStr = "_testSecure=OcG9biJ5yWUPiYMYqu1lXW8RejnnnzyoOJcVcrCpm6JnA5hBDp6I5aAzfGByhlyxOLwBm2L3ViNMb/q5vcy6emc5+Xs4rx0kJxAlVOfPbBA+EQxU8ENkFCbB5RQtzgD0rnFPjJ/SZXQJ07chZcp1jw%3D%3D; expires=Sat, 06 Jul 2024 10:58:58 GMT";

var middlewares = {
    'secure-cookie': {cookieName: '_testSecure', path: 'genji/web/middleware', secureKey: 'cipher-key', serverKey: 'hmac-key'},
    'test-cookie': {
        module: {
            name: 'TestCookie',
            make: function() {
                return function(req, res, go) {
                    var user = this.userObj;
                    if (user) {
                        if (user.id && 'username' != user.id) {
                            throw new Error('id not match');
                        }
                        if (user.expires && expires - new Date(user.expires) != 0) {
                            throw new Error('expires not match');
                        }
                        var data = user.data ? JSON.parse(user.data) : {};
                        if (data.a != 1) {
                            throw new Error('data not match');
                        }
                    } else {
                        throw new Error('cookie had not been decoded');
                    }
                    
                    var cookie = ['username', expires, {a: 1}];
                    this.writeHead(200, {'_testSecure': cookie});
                    this.end(JSON.stringify(this.userObj));
                }
            }
        }
    }
};

var server = genji.web.createServer(middlewares);

exports['test middleware secure-cookie'] = function() {
    assert.response(server, {
        url: '/',
        timeout: 100,
        method: 'GET',
        headers: {
            'Cookie': cookieStr
        }
    }, function(res) {
       assert.equal(res.headers['set-cookie'], cookieStr);
    });
};
