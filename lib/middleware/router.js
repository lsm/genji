/**
 * Module dependencies.
 */
var router = require('../router'),
    route = router.route,
    Router = router.Router,
    Handler = require('../handler').Handler;

module.exports = {
  name: 'Router',
  make: function(conf) {
    var rules,
        urls = typeof conf.urls === 'string' ? require(conf.urls) : conf.urls,
        handlerClass = conf.handler || Handler;
    
    if (!(urls instanceof Router)) {
      // try to construct router instance from definition array
      urls = new Router(urls, handlerClass);
    }
    rules = urls.toRules();

    var flaker = this;
    return function(req, res, go) {
      if (this.omitRouter) {
        return go();
      }
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
};