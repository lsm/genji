/**
 * Module dependencies.
 */
var router = require('../router'),
route = router.route,
Router = router.Router,
path = require('path'),
SimpleHandler = require('../handler').SimpleHandler;

module.exports = {
    name: 'Router',
    make: function(conf) {
        var rules = typeof conf.urls === 'string' ? require(path.join(conf.root, conf.urls)) : conf.urls;
        var handlerClass = typeof conf.handler === 'string' ? eval(conf.handler) : conf.handler || SimpleHandler;
        if (!(rules instanceof Router)) {
            var r = new Router(rules, handlerClass);
            rules = r.toRules();
        }
        
        var flaker = this;
        return function(req, res, go) {
            route.call(this, {type: req.method, condition: req.url}, rules, conf.notFound || function() {
                flaker.emit('error', {
                    code: 404,
                    message:'Content not found: ' + req.url,
                    request: req,
                    response: res
                });
            });
            go();
        }
    }
}