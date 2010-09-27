/**
 * Module dependencies.
 */
var router = require('../router'),
route = router.route,
Router = router.Router,
SimpleHandler = require('../handler').SimpleHandler;

module.exports = {
    name: 'Router',
    make: function(conf) {
        var rules,
        urls = typeof conf.urls === 'string' ? require(conf.urls) : conf.urls,
        handlerClass = typeof conf.handler === 'string' ? eval(conf.handler) : conf.handler || SimpleHandler;
        if (!(urls instanceof Router)) {
            var r = new Router(urls, handlerClass);
            rules = r.toRules();
        } else {
            rules = urls;
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