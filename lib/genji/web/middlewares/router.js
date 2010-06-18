/**
 * Module dependencies.
 */
var router = require('../router'),
route = router.route,
normalize = router.normalize,
SimpleHandler = require('./handler').Simple;


var name = 'Router';

module.exports = {
    name: name,
    makeFlake: function(conf) {
        var urls = conf.router.urls;
        var handlerClass = conf.router.handler || SimpleHandler;
        urls = normalize(urls);
        urls.forEach(function(url) {
            if (url[0] instanceof RegExp) {
                // handler class not specified, use default one
                url.unshift(handlerClass);
            }
        });
        return function(req, res, go) {
            var found = route.call(this, req, res, urls);
            if (!found) {
                this.emit('#error');
            }
            go();
        }
    }
}