var genji = require('genji'),
crypto = require('crypto')
cookie = genji.web.cookie;

var expires = new Date('Sat, 06 Jul 2024 10:58:58 GMT'),
cookieStr;

var middlewares = {
    'secure-cookie': {name: '_testSecure', secureKey: 'cipher-key', serverKey: 'hmac-key'},
    'test-cookie': {
        module: {
            name: 'TestCookie',
            make: function() {
                this.add('writeHead', function(statusCode, headers) {
                    // do nothing but get the encrypted cookie string
                    cookieStr = headers['Set-Cookie'];
                    return true;
                });
                return function(req, res, go) {
                    var user = this.userObj;
                    if ('username' != user.id) {
                        throw new Error('id not match');
                    }
                    if (new Date('Sat, 06 Jul 2024 10:58:58 GMT') - new Date(user.expires) != 0) {
                        throw new Error('expires not match');
                    }
                    var data = JSON.parse(user.data);
                    if (data.a != 1) {
                        throw new Error('data not match');
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

exports['test middleware secure-cookie'] = function(assert) {
    assert.response(server, {
        url: '/',
        timeout: 100,
        method: 'GET',
        headers: {
            'Cookie': '_testSecure=39c1bd6e2279c9650f898318aaed655d6f117a39e79f3ca838971572b0a99ba2670398410e9e88e5a0337c6072865cb138bc019b62f756234c6ffab9bdccba7a6739f97b38af1d2427102554e7cf6c103e110c54f043641426c1e5142dce00f4ae714f8c9fd2657409d3b72165ca758f; expires=Sat, 06 Jul 2024 10:58:58 GMT'
        }
    }, function(res) {
       assert.equal(cookieStr, res.headers['set-cookie']);
    });
};