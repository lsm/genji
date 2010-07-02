/**
 * Module dependencies.
 */
var router = require('../router'),
route = router.route,
normalize = router.normalize,
path = require('path'),
SimpleHandler = require('../handler').SimpleHandler;


var name = 'Router';

module.exports = {
    name: name,
    makeFlake: function(settings, conf) {
        var urls = typeof conf.urls === 'string' ? require(path.join(settings.appPath, conf.urls)) : conf.urls;
        var handlerClass = typeof conf.handler === 'string' ? eval(conf.handler) : conf.handler || SimpleHandler;
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
                this.ge.emit('error', null, 404);
            }
            go();
        }
    }
}