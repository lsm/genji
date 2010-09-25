
var router = require('genji/web/router');

module.exports = {
    'test Router#constructor': function(assert) {
        var rules = [
            ['^/hello/$', function() {}, 'get'],
            ['^/hello/$', function() {}, 'post'],
            ['^/hello/$', function() {}, 'get'],
        ];
        var r = new router.Router(rules);
    }
}